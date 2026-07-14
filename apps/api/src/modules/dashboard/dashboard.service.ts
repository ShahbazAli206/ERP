import { distributorsRepository } from '../distributors/distributors.repository';
import { aiService } from '../ai/ai.service';
import { stockService } from '../inventory/stock.service';
import { reportsService as financeReportsService } from '../finance/reports.service';
import {
  committedSalesTotal,
  groupInventoryValuationByCategory,
  groupSalesRevenueByCategory,
  rankByValueDesc,
  rankSuppliersByCommittedValue,
} from '../../shared/analytics';
import { dashboardRepository } from './dashboard.repository';
import type {
  CategoryValueDto,
  DashboardKpisDto,
  ProfitTrendPointDto,
  RecentActivityDto,
  RevenueTrendPointDto,
  TopDistributorDto,
  TopSupplierDto,
} from './dashboard.dto';
import type { DashboardRangeQuery } from './dashboard.validation';

const RECENT_ACTIVITIES_LIMIT = 20;
const TOP_N = 10;
const TRAILING_MONTHS = 12;

/** First/last-instant boundaries for the calendar month `monthsAgo` months before the current one. */
function monthRange(monthsAgo: number): { from: Date; to: Date; label: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const to = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  const label = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;
  return { from, to, label };
}

/**
 * Trailing 12 calendar months (oldest first), each resolved via financeReportsService's own
 * profitLoss() — reused rather than re-deriving income/COGS/expenses math here. 12 sequential
 * calls is an accepted tradeoff at this demo data scale (see IMPLEMENTATION_PLAN.md).
 */
async function monthlyProfitLossSeries() {
  const months = Array.from({ length: TRAILING_MONTHS }, (_, i) => monthRange(TRAILING_MONTHS - 1 - i));
  const results = await Promise.all(
    months.map((m) => financeReportsService.profitLoss({ from: m.from, to: m.to })),
  );
  return months.map((m, i) => ({ month: m.label, ...results[i] }));
}

export const dashboardService = {
  async kpis(range: DashboardRangeQuery): Promise<DashboardKpisDto> {
    const [profitLoss, cashPosition, valuation, receivables, payables, lowStockAlerts, shipmentsInTransitCount, pendingPurchaseOrdersCount] =
      await Promise.all([
        financeReportsService.profitLoss(range),
        financeReportsService.cashPosition(),
        stockService.valuation(),
        financeReportsService.receivables(),
        financeReportsService.payables(),
        stockService.lowStockAlerts(),
        dashboardRepository.shipmentsInTransitCount(),
        dashboardRepository.pendingPurchaseOrdersCount(),
      ]);

    return {
      totalRevenue: profitLoss.income,
      netProfit: profitLoss.netProfit,
      grossProfit: profitLoss.income - profitLoss.cogs,
      cashPosition: cashPosition.totalBalance,
      inventoryValue: valuation.grandTotal,
      outstandingReceivables: receivables.reduce((sum, r) => sum + r.outstandingBalance, 0),
      outstandingPayables: payables.reduce((sum, p) => sum + p.outstandingBalance, 0),
      lowStockCount: lowStockAlerts.length,
      shipmentsInTransitCount,
      pendingPurchaseOrdersCount,
      range: { from: range.from, to: range.to },
    };
  },

  async revenueTrend(): Promise<RevenueTrendPointDto[]> {
    const series = await monthlyProfitLossSeries();
    return series.map((m) => ({ month: m.month, revenue: m.income }));
  },

  async profitTrend(): Promise<ProfitTrendPointDto[]> {
    const series = await monthlyProfitLossSeries();
    return series.map((m) => ({ month: m.month, profit: m.netProfit }));
  },

  async inventoryValueByCategory(): Promise<CategoryValueDto[]> {
    const lots = await dashboardRepository.inventoryLotsWithCategory();
    return groupInventoryValuationByCategory(lots);
  },

  async salesByCategory(range: DashboardRangeQuery): Promise<CategoryValueDto[]> {
    const orders = await dashboardRepository.committedSalesOrdersInRange(range.from, range.to);
    return groupSalesRevenueByCategory(orders);
  },

  topProducts() {
    // aiService.bestSellingProducts() is already a real aggregation (top 10 by quantity sold
    // on delivered orders) — call it directly rather than reimplementing.
    return aiService.bestSellingProducts();
  },

  async topSuppliers(): Promise<TopSupplierDto[]> {
    const [items, suppliers] = await Promise.all([
      dashboardRepository.committedPurchaseOrderItems(),
      dashboardRepository.allSuppliers(),
    ]);
    return rankSuppliersByCommittedValue(items, suppliers, TOP_N).map((r) => ({
      supplierId: r.id,
      name: r.name,
      totalValue: r.totalValue,
    }));
  },

  async distributorPerformance(): Promise<TopDistributorDto[]> {
    const distributors = await dashboardRepository.allDistributors();
    // Reuse distributorsRepository.salesHistory() (the exact same shared/pricing.ts-backed
    // calculation Distributors itself uses) per distributor rather than summing a naive
    // unitPrice*quantity — that mismatch was the exact bug already fixed once for Distributors'
    // outstanding-balance calc (see IMPLEMENTATION_PLAN.md, Phase 3.6).
    const ranked = await Promise.all(
      distributors.map(async (d) => ({
        id: d.id,
        name: d.name,
        totalValue: committedSalesTotal(await distributorsRepository.salesHistory(d.id)),
      })),
    );
    return rankByValueDesc(ranked, TOP_N).map((r) => ({
      distributorId: r.id,
      name: r.name,
      totalValue: r.totalValue,
    }));
  },

  async recentActivities(): Promise<RecentActivityDto[]> {
    const rows = await dashboardRepository.recentActivities(RECENT_ACTIVITIES_LIMIT);
    return rows.map((row) => ({
      id: row.id,
      entityType: row.entityType,
      status: row.status,
      note: row.note,
      changedAt: row.changedAt,
      changedByName: row.changedBy?.name ?? null,
      referenceLabel: row.purchaseOrder?.poNumber ?? row.shipment?.shipmentNumber ?? row.salesOrder?.orderNumber ?? null,
    }));
  },
};
