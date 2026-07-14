'use client';

import { WalletIcon, LandmarkIcon, ReceiptIcon, ScaleIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { FinancePageShell, ReportsSubNav } from './finance-nav';
import { formatMoney } from './format';
import { useBalanceSheet, useCashPosition, usePayables, useReceivables } from './hooks';

/**
 * Landing page for the Reports section: the Cash Position headline number
 * (per the dataviz form heuristic, a single number is a stat tile, not a
 * chart) plus quick totals for the other reports, each linking to its own
 * full view via `ReportsSubNav`.
 */
export function ReportsOverviewView() {
  const cashPositionQuery = useCashPosition();
  const balanceSheetQuery = useBalanceSheet();
  const receivablesQuery = useReceivables();
  const payablesQuery = usePayables();

  const totalReceivables = (receivablesQuery.data ?? []).reduce((sum, r) => sum + r.outstandingBalance, 0);
  const totalPayables = (payablesQuery.data ?? []).reduce((sum, p) => sum + p.outstandingBalance, 0);

  return (
    <FinancePageShell title="Reports" description="Financial statements and standing balances, read-only.">
      <div className="space-y-4">
        <ReportsSubNav />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Cash position"
            value={cashPositionQuery.data ? formatMoney(cashPositionQuery.data.totalBalance) : '—'}
            icon={WalletIcon}
            description="Sum of all bank account balances"
            isLoading={cashPositionQuery.isLoading}
          />
          <StatCard
            title="Net equity"
            value={balanceSheetQuery.data ? formatMoney(balanceSheetQuery.data.equity) : '—'}
            icon={ScaleIcon}
            description="Assets minus liabilities, as of now"
            isLoading={balanceSheetQuery.isLoading}
          />
          <StatCard
            title="Receivables"
            value={formatMoney(totalReceivables)}
            icon={ReceiptIcon}
            description={`${receivablesQuery.data?.length ?? 0} distributor${receivablesQuery.data?.length === 1 ? '' : 's'} owing`}
            isLoading={receivablesQuery.isLoading}
          />
          <StatCard
            title="Payables"
            value={formatMoney(totalPayables)}
            icon={LandmarkIcon}
            description={`${payablesQuery.data?.length ?? 0} supplier${payablesQuery.data?.length === 1 ? '' : 's'} owed`}
            isLoading={payablesQuery.isLoading}
          />
        </div>
      </div>
    </FinancePageShell>
  );
}
