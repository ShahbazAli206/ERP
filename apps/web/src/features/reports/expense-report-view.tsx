'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InboxIcon, WalletIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { DateRangeFilter } from './date-range-filter';
import { formatMoney, startOfYear, toDateInputValue } from './format';
import { useExpenseReport } from './hooks';

// Small, non-paginated grouped-by-category result — a plain table, not `DataTable`, matching
// the `finance/receivables-view.tsx` precedent for short result sets with no pagination need.
export function ExpenseReportView() {
  const [from, setFrom] = useState(() => toDateInputValue(startOfYear()));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const query = useExpenseReport({ from, to });

  return (
    <ReportsPageShell title="Expense Report" description="Expense totals grouped by category for a date range.">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <ReportToolbar kind="expenses" params={{ from, to }} />
        </div>

        <StatCard
          title="Grand total"
          value={query.data ? formatMoney(query.data.grandTotal) : '—'}
          icon={WalletIcon}
          isLoading={query.isLoading}
          className="max-w-xs"
        />

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : query.data?.items.length ? (
                query.data.items.map((item) => (
                  <TableRow key={item.categoryId}>
                    <TableCell>{item.categoryName}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(item.total)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-56 text-center">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <InboxIcon />
                        </EmptyMedia>
                        <EmptyTitle>No expenses</EmptyTitle>
                        <EmptyDescription>No expenses fall in the selected date range.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ReportsPageShell>
  );
}
