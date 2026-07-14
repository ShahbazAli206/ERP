'use client';

import { PercentIcon, ReceiptIcon, InboxIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { formatMoney } from './format';
import { useTaxReport } from './hooks';

export function TaxReportView() {
  const query = useTaxReport();

  return (
    <ReportsPageShell title="Tax Report" description="Simplified estimated tax liability by tax type. Not a substitute for real tax filing.">
      <div className="space-y-4">
        <div className="flex justify-end">
          <ReportToolbar kind="tax" params={{}} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard title="Total invoiced" value={query.data ? formatMoney(query.data.totalInvoicedAmount) : '—'} icon={ReceiptIcon} isLoading={query.isLoading} />
          <StatCard title="Estimated tax liability" value={query.data ? formatMoney(query.data.estimatedTaxLiability) : '—'} icon={PercentIcon} isLoading={query.isLoading} />
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estimated liability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : query.data?.breakdown.length ? (
                query.data.breakdown.map((row) => (
                  <TableRow key={row.taxId}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell className="tabular-nums">{row.rate}%</TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? 'secondary' : 'outline'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatMoney(row.estimatedLiability)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-56 text-center">
                    <Empty className="border-0 p-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <InboxIcon />
                        </EmptyMedia>
                        <EmptyTitle>No tax rates configured</EmptyTitle>
                        <EmptyDescription>Add tax rates in the Tax &amp; Compliance module.</EmptyDescription>
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
