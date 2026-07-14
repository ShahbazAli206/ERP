'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PackageSearchIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { useAuth } from '@/features/auth/use-auth';
import { useShipment } from '@/features/shipments/hooks';
import { ShipmentStatusBadge } from '@/features/shipments/shipment-status-badge';
import { ShipmentTimeline } from '@/features/shipments/shipment-timeline';
import { LandedCostSummaryView } from '@/features/shipments/landed-cost-summary';
import { ShipmentStatusControl } from '@/features/shipments/shipment-status-control';
import { ShipmentEditDialog } from '@/features/shipments/shipment-edit-dialog';
import { ShipmentDeleteDialog } from '@/features/shipments/shipment-delete-dialog';
import { canDeleteShipment, canEditShipment } from '@/features/shipments/status';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { hasPermission } = useAuth();
  const query = useShipment(id);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Empty className="min-h-[50vh] flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageSearchIcon />
          </EmptyMedia>
          <EmptyTitle>Shipment not found</EmptyTitle>
          <EmptyDescription>It may have been deleted, or the link is incorrect.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const shipment = query.data;
  const editAllowed = canEditShipment(shipment.status);
  const deleteAllowed = canDeleteShipment(shipment.status);

  return (
    <>
      <Link href="/shipments" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-2 w-fit' })}>
        <ArrowLeftIcon />
        Back to shipments
      </Link>

      <PageHeader
        title={shipment.shipmentNumber}
        description={`${shipment.originPort} → ${shipment.destinationPort} · ${shipment.poNumber ? `PO ${shipment.poNumber}` : 'Standalone shipment'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ShipmentStatusBadge status={shipment.status} />
            {hasPermission('shipments:edit') &&
              (editAllowed ? (
                <ShipmentEditDialog shipment={shipment} />
              ) : (
                <Button variant="outline" disabled title="Delivered shipments can no longer be edited">
                  <PencilIcon />
                  Edit details
                </Button>
              ))}
            {hasPermission('shipments:delete') &&
              (deleteAllowed ? (
                <ShipmentDeleteDialog shipmentId={shipment.id} shipmentNumber={shipment.shipmentNumber} />
              ) : (
                <Button
                  variant="outline"
                  className="text-destructive"
                  disabled
                  title="Only shipments still in BOOKED status can be deleted"
                >
                  <Trash2Icon />
                  Delete
                </Button>
              ))}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Field label="Container" value={shipment.containerNumber ?? '—'} />
                <Field label="Origin port" value={shipment.originPort} />
                <Field label="Destination port" value={shipment.destinationPort} />
                <Field label="Estimated arrival" value={formatDate(shipment.estimatedArrival)} />
                <Field label="Actual arrival" value={formatDate(shipment.actualArrival)} />
                <Field label="Purchase order" value={shipment.poNumber ?? 'Standalone'} />
                <Field label="Currency" value={shipment.currency} />
                <Field label="Created" value={formatDate(shipment.createdAt)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>{shipment.items.length} product(s) in this shipment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipment.items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-mono text-xs">{item.productSku}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Landed cost summary</CardTitle>
              <CardDescription>Auto-calculated by the backend from freight/insurance/duty/customs inputs.</CardDescription>
            </CardHeader>
            <CardContent>
              <LandedCostSummaryView summary={shipment.landedCostSummary} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {hasPermission('shipments:edit') && <ShipmentStatusControl shipmentId={shipment.id} currentStatus={shipment.status} />}

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
              <CardDescription>Every transition this shipment has been through, including delays.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShipmentTimeline history={shipment.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
