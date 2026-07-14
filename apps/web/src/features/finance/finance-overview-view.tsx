'use client';

import Link from 'next/link';
import { BookOpenTextIcon, ReceiptIcon, ScaleIcon, WalletIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMoney } from './format';
import { useBalanceSheet, useCashPosition, useJournalEntries, useReceivables } from './hooks';

const QUICK_LINKS = [
  { href: '/finance/bank-accounts', title: 'Bank Accounts', description: 'Bank accounts backing the cash position.' },
  { href: '/finance/chart-of-accounts', title: 'Chart of Accounts', description: 'The full ledger account list, filterable by type.' },
  { href: '/finance/journal-entries', title: 'Journal Entries', description: 'Double-entry postings to the general ledger.' },
  { href: '/finance/reports/profit-loss', title: 'Profit & Loss', description: 'Income, COGS, expenses and net profit for a date range.' },
  { href: '/finance/reports/balance-sheet', title: 'Balance Sheet', description: 'Assets, liabilities, and equity as of now.' },
  { href: '/finance/reports/cash-flow', title: 'Cash Flow', description: 'Incoming and outgoing totals with a day-by-day breakdown.' },
];

export function FinanceOverviewView() {
  const cashPositionQuery = useCashPosition();
  const balanceSheetQuery = useBalanceSheet();
  const receivablesQuery = useReceivables();
  const journalEntriesQuery = useJournalEntries({ page: 1, pageSize: 1 });

  const totalReceivables = (receivablesQuery.data ?? []).reduce((sum, r) => sum + r.outstandingBalance, 0);

  return (
    <div className="space-y-6">
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
          isLoading={balanceSheetQuery.isLoading}
        />
        <StatCard
          title="Outstanding receivables"
          value={formatMoney(totalReceivables)}
          icon={ReceiptIcon}
          description={`${receivablesQuery.data?.length ?? 0} distributor${receivablesQuery.data?.length === 1 ? '' : 's'} owing`}
          isLoading={receivablesQuery.isLoading}
        />
        <StatCard
          title="Journal entries"
          value={journalEntriesQuery.data?.pagination.total ?? '—'}
          icon={BookOpenTextIcon}
          description="Total ledger postings recorded"
          isLoading={journalEntriesQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
