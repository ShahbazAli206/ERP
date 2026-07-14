'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { FileQuestionIcon } from 'lucide-react';
import { usePurchaseOrder } from '@/features/procurement/hooks';
import { PoStatusBadge } from '@/features/procurement/components/status-badge';
import { PoActions } from '@/features/procurement/components/po-actions';
import { StatusTimeline } from '@/features/procurement/components/status-timeline';
import { AttachmentsSection } from '@/features/procurement/components/attachments-section';
import { formatDate, formatMoney } from '@/features/procurement/format';

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = usePurchaseOrder(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Empty className="min-h-[50vh] flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestionIcon />
          </EmptyMedia>
          <EmptyTitle>Purchase order not found</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is incorrect.</EmptyDescription>
        </EmptyHeader>
        <Link href="/procurement" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Back to Procurement
        </Link>
      </Empty>
    );
  }

  const po = query.data;

  return (
    <>
      <Link href="/procurement" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-2 -ml-2')}>
        <ArrowLeftIcon /> Back to Procurement
      </Link>

      <PageHeader
        title={po.poNumber}
        description={`${po.supplier.name} · ${formatDate(po.orderDate)}`}
        actions={<PoStatusBadge status={po.status} className="text-sm" />}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <PoActions po={po} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Supplier</dt>
                  <dd className="font-medium">{po.supplier.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="font-medium">{po.supplier.country}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{po.currency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Exchange rate to base</dt>
                  <dd className="font-medium tabular-nums">{po.exchangeRateToBase}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Order date</dt>
                  <dd className="font-medium">{formatDate(po.orderDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expected arrival</dt>
                  <dd className="font-medium">{po.expectedArrival ? formatDate(po.expectedArrival) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created by</dt>
                  <dd className="font-medium">{po.createdByName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Approved by</dt>
                  <dd className="font-medium">{po.approvedByName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total amount</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(po.totalAmount, po.currency)}</dd>
                </div>
              </dl>
              {po.notes && (
                <div className="mt-4 rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
                  {po.notes}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-muted-foreground">{item.productSku}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.receivedQuantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(item.unitPrice, po.currency)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(item.lineTotal, po.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentsSection poId={po.id} attachments={po.attachments} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline entries={po.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
