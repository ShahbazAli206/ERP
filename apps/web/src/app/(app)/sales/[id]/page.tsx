'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, FileQuestionIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useSalesOrder } from '@/features/sales/hooks';
import { SoStatusBadge } from '@/features/sales/components/status-badge';
import { SoActions } from '@/features/sales/components/so-actions';
import { StatusTimeline } from '@/features/sales/components/status-timeline';
import { InvoiceSection } from '@/features/sales/components/invoice-section';
import { ReturnsSection } from '@/features/sales/components/returns-section';
import { formatDate, formatMoney, formatPercent } from '@/features/sales/format';

export default function SalesOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const query = useSalesOrder(id);

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
          <EmptyTitle>Sales order not found</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is incorrect.</EmptyDescription>
        </EmptyHeader>
        <Link href="/sales" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          Back to Sales
        </Link>
      </Empty>
    );
  }

  const order = query.data;

  return (
    <>
      <Link href="/sales" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-2 -ml-2')}>
        <ArrowLeftIcon /> Back to Sales
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`${order.distributor.name} · ${formatDate(order.orderDate)}`}
        actions={<SoStatusBadge status={order.status} className="text-sm" />}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SoActions order={order} />
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
                  <dt className="text-muted-foreground">Distributor</dt>
                  <dd className="font-medium">{order.distributor.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Region</dt>
                  <dd className="font-medium">{order.distributor.region}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pricing group discount</dt>
                  <dd className="font-medium tabular-nums">
                    {formatPercent(order.distributor.pricingGroupDiscountPercent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Currency</dt>
                  <dd className="font-medium">{order.currency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Order-level discount</dt>
                  <dd className="font-medium tabular-nums">{formatPercent(order.discountPercent)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Order date</dt>
                  <dd className="font-medium">{formatDate(order.orderDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created by</dt>
                  <dd className="font-medium">{order.createdByName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total amount</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(order.totalAmount, order.currency)}</dd>
                </div>
              </dl>
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
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Item Discount</TableHead>
                      <TableHead className="text-right">Effective Discount</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-muted-foreground">{item.productSku}</TableCell>
                        <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(item.unitPrice, order.currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatPercent(item.discount)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPercent(item.effectiveDiscountPercent)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(item.lineTotal, order.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Effective discount = item discount + distributor pricing-group discount ({formatPercent(order.distributor.pricingGroupDiscountPercent)}) +
                automatic volume discount (≥50 units: +2.5%, ≥100: +5%), summed and capped at 100%. The
                order&apos;s {formatPercent(order.discountPercent)} order-level discount is then applied on top of the
                line total.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice &amp; payments</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceSection order={order} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Returns &amp; credit notes</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnsSection order={order} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline entries={order.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
