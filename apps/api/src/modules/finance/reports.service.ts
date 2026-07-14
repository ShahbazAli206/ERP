import { distributorsRepository } from '../distributors/distributors.repository';
import { suppliersRepository } from '../suppliers/suppliers.repository';
import { reportsRepository } from './reports.repository';
import type {
  BalanceSheetDto,
  CashFlowDto,
  CashPositionDto,
  PayableDto,
  ProfitLossDto,
  ReceivableDto,
} from './reports.dto';
import type { DateRangeQuery } from './reports.validation';

export const reportsService = {
  async receivables(): Promise<ReceivableDto[]> {
    const distributors = await reportsRepository.allDistributors();
    // Reuse the distributors module's own outstanding-balance calculation rather than
    // reimplementing it here — two modules computing the same total differently is how
    // this codebase previously ended up with numbers that silently disagreed.
    const results = await Promise.all(
      distributors.map(async (d) => ({
        distributorId: d.id,
        name: d.name,
        outstandingBalance: await distributorsRepository.outstandingBalance(d.id),
      })),
    );
    return results.filter((r) => r.outstandingBalance > 0);
  },

  async payables(): Promise<PayableDto[]> {
    const suppliers = await reportsRepository.allSuppliers();
    // Reuse the suppliers module's own outstanding-balance calculation for the same reason.
    const results = await Promise.all(
      suppliers.map(async (s) => ({
        supplierId: s.id,
        name: s.name,
        outstandingBalance: await suppliersRepository.outstandingBalance(s.id),
      })),
    );
    return results.filter((r) => r.outstandingBalance > 0);
  },

  async cashPosition(): Promise<CashPositionDto> {
    const agg = await reportsRepository.bankAccountsBalanceSum();
    return { totalBalance: agg._sum.balance ?? 0 };
  },

  async profitLoss(range: DateRangeQuery): Promise<ProfitLossDto> {
    const [incomeAgg, expenseAgg, deliveredItems] = await Promise.all([
      reportsRepository.incomeInRange(range.from, range.to),
      reportsRepository.expensesInRange(range.from, range.to),
      reportsRepository.deliveredSalesOrderItemsInRange(range.from, range.to),
    ]);

    const income = incomeAgg._sum.totalAmount ?? 0;
    const expenses = expenseAgg._sum.amount ?? 0;
    // Simplified demo approximation of COGS — see reports.repository.ts for details.
    const cogs = deliveredItems.reduce((sum, item) => sum + item.quantity * item.product.costPrice, 0);

    return { income, cogs, expenses, netProfit: income - cogs - expenses };
  },

  async balanceSheet(): Promise<BalanceSheetDto> {
    const [cashPosition, lots, receivables, payables] = await Promise.all([
      reportsService.cashPosition(),
      reportsRepository.inventoryLotsValuation(),
      reportsService.receivables(),
      reportsService.payables(),
    ]);

    const inventoryValuation = lots.reduce((sum, lot) => sum + lot.quantity * lot.costPrice, 0);
    const totalReceivables = receivables.reduce((sum, r) => sum + r.outstandingBalance, 0);
    const totalPayables = payables.reduce((sum, p) => sum + p.outstandingBalance, 0);

    const assets = cashPosition.totalBalance + inventoryValuation + totalReceivables;
    const liabilities = totalPayables;
    const equity = assets - liabilities;

    return { assets, liabilities, equity };
  },

  async cashFlow(range: DateRangeQuery): Promise<CashFlowDto> {
    const [incomingPayments, outgoingPayments] = await Promise.all([
      reportsRepository.paymentsInRange(range.from, range.to, 'INCOMING'),
      reportsRepository.paymentsInRange(range.from, range.to, 'OUTGOING'),
    ]);

    const incoming = incomingPayments.reduce((sum, p) => sum + p.amount, 0);
    const outgoing = outgoingPayments.reduce((sum, p) => sum + p.amount, 0);

    const byDate = new Map<string, { incoming: number; outgoing: number }>();
    for (const p of incomingPayments) {
      const key = p.paymentDate.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { incoming: 0, outgoing: 0 };
      entry.incoming += p.amount;
      byDate.set(key, entry);
    }
    for (const p of outgoingPayments) {
      const key = p.paymentDate.toISOString().slice(0, 10);
      const entry = byDate.get(key) ?? { incoming: 0, outgoing: 0 };
      entry.outgoing += p.amount;
      byDate.set(key, entry);
    }

    const byDateArray = Array.from(byDate.entries())
      .map(([date, v]) => ({ date, incoming: v.incoming, outgoing: v.outgoing, net: v.incoming - v.outgoing }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { incoming, outgoing, netCashFlow: incoming - outgoing, byDate: byDateArray };
  },
};
