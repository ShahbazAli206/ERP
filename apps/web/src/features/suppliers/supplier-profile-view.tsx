'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  BoxesIcon,
  PackageIcon,
  PencilIcon,
  PowerIcon,
  ReceiptTextIcon,
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/use-auth';
import { ConfirmDialog } from './confirm-dialog';
import { SupplierContactsCard } from './supplier-contacts-card';
import { SupplierFormDialog } from './supplier-form-dialog';
import { useDeactivateSupplier, useSupplier } from './hooks';

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    // Unrecognized currency code — fall back to a plain number so a typo'd seed value never crashes the page.
    return `${amount.toLocaleString()} ${currency}`;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const PO_STATUS_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  ORDERED: 'secondary',
  PARTIALLY_RECEIVED: 'secondary',
  RECEIVED: 'secondary',
  CANCELLED: 'destructive',
};

export function SupplierProfileView({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const query = useSupplier(supplierId);
  const deactivateMutation = useDeactivateSupplier();

  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const canEdit = hasPermission('suppliers:edit');
  const canDeactivate = hasPermission('suppliers:delete');

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
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>Couldn&apos;t load this supplier</EmptyTitle>
          <EmptyDescription>It may not exist, or you may not have access to it.</EmptyDescription>
        </EmptyHeader>
        <Link href="/suppliers" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back to suppliers
        </Link>
      </Empty>
    );
  }

  const supplier = query.data;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2.5 mb-2" onClick={() => router.push('/suppliers')}>
          <ArrowLeftIcon />
          Back to suppliers
        </Button>
        <PageHeader
          title={supplier.name}
          description={`${supplier.country} · ${supplier.currency}`}
          actions={
            <>
              <Badge variant={supplier.isActive ? 'secondary' : 'outline'}>{supplier.isActive ? 'Active' : 'Inactive'}</Badge>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <PencilIcon />
                  Edit
                </Button>
              )}
              {canDeactivate && supplier.isActive && (
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
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(supplier.outstandingBalance, 'PKR')}
          description="Base currency (PKR)"
          icon={WalletIcon}
        />
        <StatCard title="Contacts" value={supplier.contacts.length} icon={ReceiptTextIcon} />
        <StatCard title="Products Purchased" value={supplier.products.length} icon={BoxesIcon} />
        <StatCard title="Purchase Orders" value={supplier.purchaseHistory.length} icon={PackageIcon} />
      </div>

      {supplier.address && (
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{supplier.address}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SupplierContactsCard supplierId={supplier.id} contacts={supplier.contacts} canEdit={canEdit} />

        <Card>
          <CardHeader>
            <CardTitle>Products purchased</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.products.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No products purchased from this supplier yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {supplier.products.map((product) => (
                  <li key={product.id}>
                    <Badge variant="outline" className="gap-1.5 py-1">
                      <span className="font-mono text-[0.7rem] text-muted-foreground">{product.sku}</span>
                      {product.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.purchaseHistory.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No purchase orders for this supplier yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.purchaseHistory.map((po) => (
                    <TableRow key={po.purchaseOrderId}>
                      <TableCell className="font-medium">{po.poNumber}</TableCell>
                      <TableCell>{formatDate(po.orderDate)}</TableCell>
                      <TableCell>
                        <Badge variant={PO_STATUS_VARIANT[po.status] ?? 'outline'}>{po.status.replaceAll('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(po.totalAmount, supplier.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && <SupplierFormDialog open={editOpen} onOpenChange={setEditOpen} supplierId={supplier.id} />}

      {canDeactivate && (
        <ConfirmDialog
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          title="Deactivate supplier"
          description={`Deactivate ${supplier.name}? It will be hidden from active-supplier workflows but its history is kept. You can reactivate it later via Edit.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          onConfirm={() => {
            deactivateMutation.mutate(supplier.id, {
              onSuccess: () => {
                toast.success('Supplier deactivated');
                setDeactivateOpen(false);
              },
              onError: () => toast.error('Could not deactivate supplier'),
            });
          }}
        />
      )}
    </div>
  );
}
