'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  BuildingIcon,
  PencilIcon,
  PowerIcon,
  ReceiptTextIcon,
  TagIcon,
  WalletIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { useAuth } from '@/features/auth/use-auth';
import { ConfirmDialog } from './confirm-dialog';
import { DistributorFormDialog } from './distributor-form-dialog';
import { formatCurrency, formatDate } from './format';
import { useDeactivateDistributor, useDistributor } from './hooks';

const SO_STATUS_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  CONFIRMED: 'secondary',
  PROCESSING: 'secondary',
  SHIPPED: 'secondary',
  DELIVERED: 'secondary',
  CANCELLED: 'destructive',
};

export function DistributorProfileView({ distributorId }: { distributorId: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const query = useDistributor(distributorId);
  const deactivateMutation = useDeactivateDistributor();

  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const canEdit = hasPermission('distributors:edit');
  const canDeactivate = hasPermission('distributors:delete');

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Empty className="min-h-[50vh] flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BuildingIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load this distributor</EmptyTitle>
          <EmptyDescription>It may not exist, or you may not have access to it.</EmptyDescription>
        </EmptyHeader>
        <Link href="/distributors" className={buttonVariants({ variant: 'outline' })}>
          Back to distributors
        </Link>
      </Empty>
    );
  }

  const distributor = query.data;
  const hasContactInfo = Boolean(
    distributor.contactName || distributor.contactEmail || distributor.contactPhone || distributor.address,
  );

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2.5 mb-2" onClick={() => router.push('/distributors')}>
          <ArrowLeftIcon />
          Back to distributors
        </Button>
        <PageHeader
          title={distributor.name}
          description={`Region: ${distributor.region}`}
          actions={
            <>
              <Badge variant={distributor.isActive ? 'secondary' : 'outline'}>
                {distributor.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <PencilIcon />
                  Edit
                </Button>
              )}
              {canDeactivate && distributor.isActive && (
                <Button variant="destructive" size="sm" onClick={() => setDeactivateOpen(true)}>
                  <PowerIcon />
                  Deactivate
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Credit Limit" value={formatCurrency(distributor.creditLimit)} icon={WalletIcon} />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(distributor.outstandingBalance)}
          description="Unpaid, non-cancelled invoices net of credit notes"
          icon={ReceiptTextIcon}
        />
        <StatCard
          title="Pricing Group"
          value={distributor.pricingGroup?.name ?? 'None'}
          description={distributor.pricingGroup ? `${distributor.pricingGroup.discountPercent}% discount` : 'No group assigned'}
          icon={TagIcon}
        />
        <StatCard title="Sales Orders" value={distributor.salesHistory.length} icon={BuildingIcon} />
      </div>

      {hasContactInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Contact &amp; address</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {distributor.contactName && (
              <div>
                <span className="text-muted-foreground">Contact: </span>
                {distributor.contactName}
              </div>
            )}
            {distributor.contactEmail && (
              <div>
                <span className="text-muted-foreground">Email: </span>
                {distributor.contactEmail}
              </div>
            )}
            {distributor.contactPhone && (
              <div>
                <span className="text-muted-foreground">Phone: </span>
                {distributor.contactPhone}
              </div>
            )}
            {distributor.address && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Address: </span>
                {distributor.address}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sales history</CardTitle>
        </CardHeader>
        <CardContent>
          {distributor.salesHistory.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No sales orders for this distributor yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributor.salesHistory.map((so) => (
                    <TableRow key={so.salesOrderId}>
                      <TableCell className="font-medium">{so.orderNumber}</TableCell>
                      <TableCell>{formatDate(so.orderDate)}</TableCell>
                      <TableCell>
                        <Badge variant={SO_STATUS_VARIANT[so.status] ?? 'outline'}>{so.status.replaceAll('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(so.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {distributor.paymentHistory.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded for this distributor yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributor.paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.method.replaceAll('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{payment.reference ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(payment.amount, payment.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && <DistributorFormDialog open={editOpen} onOpenChange={setEditOpen} distributorId={distributor.id} />}

      {canDeactivate && (
        <ConfirmDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          title="Deactivate distributor"
          description={`Deactivate ${distributor.name}? It will be hidden from active-distributor workflows but its history is kept. You can reactivate it later via Edit.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          onConfirm={() => {
            deactivateMutation.mutate(distributor.id, {
              onSuccess: () => {
                toast.success('Distributor deactivated');
                setDeactivateOpen(false);
              },
              onError: () => toast.error('Could not deactivate distributor'),
            });
          }}
        />
      )}
    </div>
  );
}
