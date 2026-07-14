'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCreditNotes, useReturns } from '@/features/sales/hooks';
import { formatDate } from '@/features/sales/format';

/**
 * Browsable returns + credit note history across every sales order. The
 * order detail page's "Returns & credit notes" section covers the
 * single-order workflow (record a return, auto-issue its credit note); this
 * is the cross-order view. Both `/sales/returns` and `/sales/credit-notes`
 * are plain unpaginated arrays server-side (no search/filter query params),
 * so this page renders them as-is rather than adding client pagination the
 * API doesn't support.
 */
export default function ReturnsPage() {
  const returnsQuery = useReturns();
  const creditNotesQuery = useCreditNotes();

  const creditNotesById = new Map((creditNotesQuery.data ?? []).map((cn) => [cn.salesReturnId, cn]));

  return (
    <>
      <Link href="/sales" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-2 -ml-2')}>
        <ArrowLeftIcon /> Back to Sales
      </Link>

      <PageHeader title="Returns & Credit Notes" description="Every return recorded against a sales order and its resulting credit note." />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Returns</CardTitle>
          </CardHeader>
          <CardContent>
            {returnsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !returnsQuery.data?.length ? (
              <p className="text-sm text-muted-foreground">No returns have been recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sales Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Credit Note</TableHead>
                      <TableHead>Recorded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnsQuery.data.map((r) => {
                      const creditNote = creditNotesById.get(r.id);
                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Link href={`/sales/${r.salesOrderId}`} className="font-medium text-primary hover:underline">
                              {r.orderNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{r.productName}</TableCell>
                          <TableCell className="text-right tabular-nums">{r.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{r.reason ?? '—'}</TableCell>
                          <TableCell>
                            {creditNote ? (
                              <Badge variant="outline">{creditNote.creditNoteNumber}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit notes</CardTitle>
          </CardHeader>
          <CardContent>
            {creditNotesQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !creditNotesQuery.data?.length ? (
              <p className="text-sm text-muted-foreground">No credit notes have been issued yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Credit Note</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Issued</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditNotesQuery.data.map((cn) => (
                      <TableRow key={cn.id}>
                        <TableCell className="font-medium">{cn.creditNoteNumber}</TableCell>
                        <TableCell className="text-right tabular-nums">{cn.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-muted-foreground">{cn.reason ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(cn.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
