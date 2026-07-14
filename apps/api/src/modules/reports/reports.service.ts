import type { Pagination } from '../../shared/response';
import { toSkipTake } from '../../shared/pagination';
import { orderTotal } from '../../shared/pricing';
import { toBaseAmount } from '../../shared/currency';
import { committedSalesTotal, rankSuppliersByCommittedValue } from '../../shared/analytics';
import { distributorsRepository } from '../distributors/distributors.repository';
import { suppliersRepository } from '../suppliers/suppliers.repository';
import { expensesService } from '../expenses/expenses.service';
import { stockService } from '../inventory/stock.service';
import { reportsService as financeReportsService } from '../finance/reports.service';
import type { DateRangeQuery } from '../finance/reports.validation';
import { taxService } from '../tax/tax.service';
import { reportsRepository } from './reports.repository';
import type {
  CashFlowReportDto,
  DistributorReportRowDto,
  ExpenseReportProxyDto,
  InventoryReportDto,
  ProfitReportDto,
  PurchaseReportDto,
  SalesReportDto,
  StatusBreakdownDto,
  SupplierReportRowDto,
  TaxReportDto,
} from './reports.dto';
import type { InventoryReportQuery, PurchaseReportQuery, SalesReportQuery } from './reports.validation';

function summarizeByStatus(rows: Array<{ status: string; totalAmount: number }>): StatusBreakdownDto[] {
  const byStatus = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    const entry = byStatus.get(row.status) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += row.totalAmount;
    byStatus.set(row.status, entry);
  }
  return Array.from(byStatus.entries()).map(([status, v]) => ({ status, count: v.count, total: v.total }));
}

export const reportsService = {
  /**
   * Sales Report — the one genuinely new listing in this module. Fetches every sales order in
   * the range (status/distributor filters applied by the repository query), computes each
   * order's real total via shared/pricing.ts's orderTotal() fed with the same
   * items+pricingGroupDiscount+orderDiscount shape salesOrders.service.ts and
   * distributors.repository.ts's salesHistory() already use, then paginates in-memory so the
   * summary block (grand total, count, status breakdown) reflects the *entire* filtered range
   * rather than just the current page.
   */
  async salesReport(query: SalesReportQuery): Promise<{ data: SalesReportDto; pagination: Pagination }> {
    const orders = await reportsRepository.salesOrdersInRange(query.from, query.to, {
      status: query.status,
      distributorId: query.distributorId,
    });

    const computed = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      orderDate: o.orderDate,
      distributorId: o.distributorId,
      distributorName: o.distributor.name,
      status: o.status as string,
      totalAmount: orderTotal({
        items: o.items,
        pricingGroupDiscountPercent: o.distributor.pricingGroup?.discountPercent ?? 0,
        orderDiscountPercent: o.discountPercent,
      }),
    }));

    const total = computed.length;
    const { skip, take } = toSkipTake(query);
    const rows = computed.slice(skip, skip + take);

    return {
      data: {
        rows,
        summary: {
          orderCount: total,
          grandTotal: computed.reduce((sum, c) => sum + c.totalAmount, 0),
          byStatus: summarizeByStatus(computed),
        },
      },
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  /**
   * Purchase Report — purchase orders have no discount/pricing-group math, so each order's
   * native-currency total is the plain sum(item.quantity * item.unitPrice) already used by
   * suppliers.repository.ts's purchaseHistory(). Unlike Sales Orders (always PKR, no per-order
   * rate), Purchase Orders carry their own `currency` + `exchangeRateToBase` and are NOT
   * guaranteed to share a currency across suppliers — so the cross-order summary (grandTotal,
   * byStatus totals) is computed from each row's totalAmountBase (converted via
   * shared/currency.ts), never the raw native totalAmount, or it would silently add unlike
   * currency units together (see IMPLEMENTATION_PLAN.md Gap #8 — this bug previously existed
   * in suppliers.repository.ts's outstandingBalance and shared/analytics.ts's supplier ranking
   * too, both fixed alongside this one). Same in-memory pagination approach as Sales Report so
   * the summary reflects the whole filtered range.
   */
  async purchaseReport(
    query: PurchaseReportQuery,
  ): Promise<{ data: PurchaseReportDto; pagination: Pagination }> {
    const orders = await reportsRepository.purchaseOrdersInRange(query.from, query.to, {
      status: query.status,
      supplierId: query.supplierId,
    });

    const computed = orders.map((po) => {
      const totalAmount = po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      return {
        id: po.id,
        poNumber: po.poNumber,
        orderDate: po.orderDate,
        supplierId: po.supplierId,
        supplierName: po.supplier.name,
        status: po.status as string,
        currency: po.currency,
        exchangeRateToBase: po.exchangeRateToBase,
        totalAmount,
        totalAmountBase: toBaseAmount(totalAmount, po.exchangeRateToBase),
      };
    });

    const total = computed.length;
    const { skip, take } = toSkipTake(query);
    const rows = computed.slice(skip, skip + take);

    return {
      data: {
        rows,
        summary: {
          orderCount: total,
          grandTotal: computed.reduce((sum, c) => sum + c.totalAmountBase, 0),
          byStatus: summarizeByStatus(
            computed.map((c) => ({ status: c.status, totalAmount: c.totalAmountBase })),
          ),
        },
      },
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  /**
   * Inventory Report — merges inventory's own valuation() lines with lowStockAlerts() and
   * expiryAlerts() flags. Does not recompute stock-on-hand or valuation math; the "isLowStock"/
   * "isExpiringSoon" flags are derived purely from which productIds already appear in those two
   * alert lists.
   */
  async inventoryReport(query: InventoryReportQuery): Promise<InventoryReportDto> {
    const [valuation, lowStock, expiring] = await Promise.all([
      stockService.valuation(query.warehouseId),
      stockService.lowStockAlerts(),
      stockService.expiryAlerts(query.expiryWithinDays),
    ]);

    const lowStockIds = new Set(lowStock.map((l) => l.productId));
    const nearestExpiryByProduct = new Map<string, Date>();
    for (const e of expiring) {
      const existing = nearestExpiryByProduct.get(e.productId);
      if (!existing || e.expiryDate < existing) {
        nearestExpiryByProduct.set(e.productId, e.expiryDate);
      }
    }

    const lines = valuation.lines.map((line) => ({
      ...line,
      isLowStock: lowStockIds.has(line.productId),
      isExpiringSoon: nearestExpiryByProduct.has(line.productId),
      nearestExpiryDate: nearestExpiryByProduct.get(line.productId) ?? null,
    }));

    return { lines, grandTotal: valuation.grandTotal };
  },

  /** Thin proxy over Finance's own profit & loss computation — see reports.dto.ts. */
  profitReport(range: DateRangeQuery): Promise<ProfitReportDto> {
    return financeReportsService.profitLoss(range);
  },

  /** Thin proxy over Finance's own cash flow computation — see reports.dto.ts. */
  cashFlowReport(range: DateRangeQuery): Promise<CashFlowReportDto> {
    return financeReportsService.cashFlow(range);
  },

  /** Thin proxy over Expenses' own report() (grouped by category, with a grand total). */
  expenseReport(from: Date, to: Date): Promise<ExpenseReportProxyDto> {
    return expensesService.report(from, to);
  },

  /**
   * Supplier Report — full listing of every supplier (not just top-N). Committed purchase value
   * reuses shared/analytics.ts's rankSuppliersByCommittedValue (the exact same
   * quantity*unitPrice-summed-by-supplier math Dashboard's topSuppliers() uses) called with no
   * effective cap so every supplier is represented; suppliers absent from the committed-items
   * set (no ORDERED-or-later POs yet) default to 0 rather than being omitted. Outstanding
   * balance is never recomputed here — it's suppliers.repository.ts's own calculation.
   */
  async supplierReport(): Promise<SupplierReportRowDto[]> {
    const [suppliers, committedItems] = await Promise.all([
      reportsRepository.allSuppliersWithMeta(),
      reportsRepository.committedPurchaseOrderItems(),
    ]);

    const ranked = rankSuppliersByCommittedValue(committedItems, suppliers, suppliers.length);
    const committedValueById = new Map(ranked.map((r) => [r.id, r.totalValue]));

    const rows = await Promise.all(
      suppliers.map(async (s) => ({
        supplierId: s.id,
        name: s.name,
        country: s.country,
        currency: s.currency,
        totalCommittedPurchaseValue: committedValueById.get(s.id) ?? 0,
        outstandingBalance: await suppliersRepository.outstandingBalance(s.id),
        purchaseOrderCount: s._count.purchaseOrders,
      })),
    );

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Distributor Report — full listing of every distributor. Committed sales value and
   * outstanding balance both delegate to distributors.repository.ts (salesHistory() +
   * committedSalesTotal(), outstandingBalance()) — the same real-pricing-based calculations
   * Dashboard's distributorPerformance() and Distributors' own outstanding-balance endpoint use,
   * never a hand-summed unitPrice*quantity.
   */
  async distributorReport(): Promise<DistributorReportRowDto[]> {
    const distributors = await reportsRepository.allDistributorsWithMeta();

    const rows = await Promise.all(
      distributors.map(async (d) => {
        const history = await distributorsRepository.salesHistory(d.id);
        return {
          distributorId: d.id,
          name: d.name,
          region: d.region,
          pricingGroupName: d.pricingGroup?.name ?? null,
          totalCommittedSalesValue: committedSalesTotal(history),
          outstandingBalance: await distributorsRepository.outstandingBalance(d.id),
          salesOrderCount: d._count.salesOrders,
        };
      }),
    );

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Tax Report — built on tax.service.ts's own complianceDashboard() aggregate (which already
   * owns the totalInvoicedAmount sum and the simplified liability-estimate formula). The only
   * thing added here is a per-tax-type breakdown: every configured tax's own estimated liability
   * using that exact same formula (totalInvoicedAmount * rate / 100), zeroed out for inactive
   * taxes since they don't currently apply. The underlying invoice aggregation is not
   * recomputed.
   */
  async taxReport(): Promise<TaxReportDto> {
    const [dashboard, taxes] = await Promise.all([
      taxService.complianceDashboard(),
      reportsRepository.allTaxes(),
    ]);

    const breakdown = taxes.map((t) => ({
      taxId: t.id,
      name: t.name,
      type: t.type as string,
      rate: t.rate,
      isActive: t.isActive,
      estimatedLiability: t.isActive ? (dashboard.totalInvoicedAmount * t.rate) / 100 : 0,
    }));

    return {
      totalInvoicedAmount: dashboard.totalInvoicedAmount,
      activeGstRatePercent: dashboard.activeGstRatePercent,
      estimatedTaxLiability: dashboard.estimatedTaxLiability,
      breakdown,
    };
  },
};
