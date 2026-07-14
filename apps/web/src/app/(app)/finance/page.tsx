'use client';

import { FinancePageShell } from '@/features/finance/finance-nav';
import { FinanceOverviewView } from '@/features/finance/finance-overview-view';

export default function Page() {
  return (
    <FinancePageShell title="Finance" description="General ledger, journal entries, and financial statements.">
      <FinanceOverviewView />
    </FinancePageShell>
  );
}
