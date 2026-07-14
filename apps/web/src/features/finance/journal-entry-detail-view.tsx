'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { FileWarningIcon } from 'lucide-react';
import { FinancePageShell } from './finance-nav';
import { formatMoney } from './format';
import { useJournalEntry } from './hooks';

export function JournalEntryDetailView({ id }: { id: string }) {
  const router = useRouter();
  const query = useJournalEntry(id);

  return (
    <FinancePageShell
      title="Journal Entry"
      description={query.data ? (query.data.description ?? 'No description') : 'Journal entry detail'}
      actions={
        <Button variant="outline" onClick={() => router.push('/finance/journal-entries')}>
          <ArrowLeftIcon />
          Back to Journal Entries
        </Button>
      }
    >
      {query.isLoading ? (
        <Card className="max-w-3xl">
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
        </Card>
      ) : query.isError || !query.data ? (
        <Empty className="min-h-[40vh]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileWarningIcon />
            </EmptyMedia>
            <EmptyTitle>Journal entry not found</EmptyTitle>
            <EmptyDescription>It may have been removed, or the link is incorrect.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Lines</CardTitle>
              <CardDescription>
                {new Date(query.data.entryDate).toLocaleDateString()}
                {query.data.reference && ` · ${query.data.reference}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{line.accountCode}</span>{' '}
                          <span className="font-medium">{line.accountName}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{line.debit > 0 ? formatMoney(line.debit) : '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{line.credit > 0 ? formatMoney(line.credit) : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(query.data.totalDebit)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(query.data.totalCredit)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(query.data.entryDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span>{query.data.reference ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="text-right">{query.data.description ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground">Total debit</span>
                <span className="tabular-nums">{formatMoney(query.data.totalDebit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total credit</span>
                <span className="tabular-nums">{formatMoney(query.data.totalCredit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(query.data.createdAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </FinancePageShell>
  );
}
