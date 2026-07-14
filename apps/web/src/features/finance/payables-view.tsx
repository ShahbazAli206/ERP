'use client';

import { LandmarkIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { InboxIcon } from 'lucide-react';
import { FinancePageShell, ReportsSubNav } from './finance-nav';
import { formatMoney } from './format';
import { usePayables } from './hooks';

export function PayablesView() {
  const query = usePayables();

  const rows = [...(query.data ?? [])].sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  const total = rows.reduce((sum, p) => sum + p.outstandingBalance, 0);

  return (
    <FinancePageShell title="Payables" description="Suppliers with a positive outstanding balance owed by the company.">
      <div className="space-y-4">
        <ReportsSubNav />

        <StatCard
          title="Total payables"
          value={formatMoney(total)}
          icon={LandmarkIcon}
          description={`${rows.length} supplier${rows.length === 1 ? '' : 's'} with an outstanding balance`}
          isLoading={query.isLoading}
          className="max-w-sm"
        />

        <Card>
          <CardHeader>
            <CardTitle>Outstanding by supplier</CardTitle>
            <CardDescription>Sorted highest balance first.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Outstanding balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={2}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-56 text-center">
                        <Empty className="border-0 p-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <InboxIcon />
                            </EmptyMedia>
                            <EmptyTitle>No outstanding payables</EmptyTitle>
                            <EmptyDescription>Every supplier is paid up.</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.supplierId}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(row.outstandingBalance)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancePageShell>
  );
}
