'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/use-auth';
import { InventoryPageShell } from './inventory-nav';
import { ProductLotsTable } from './product-lots-table';
import { ProductFormDialog } from './product-form-dialog';
import { useProduct } from './hooks';

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProductDetailView({ productId }: { productId: string }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('inventory:edit');

  const [editOpen, setEditOpen] = useState(false);
  const query = useProduct(productId);

  if (query.isLoading) {
    return (
      <InventoryPageShell title="Loading…" actions={null}>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </InventoryPageShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <InventoryPageShell title="Product not found">
        <Empty className="min-h-[40vh] border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Couldn&apos;t load this product</EmptyTitle>
            <EmptyDescription>It may have been removed, or the link is incorrect.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </InventoryPageShell>
    );
  }

  const product = query.data;

  return (
    <InventoryPageShell
      title={product.name}
      description={`SKU ${product.sku}${product.barcode ? ` · Barcode ${product.barcode}` : ''}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/inventory/products" className={cn(buttonVariants({ variant: 'outline' }))}>
            <ArrowLeftIcon />
            Back to Products
          </Link>
          {canEdit && (
            <Button onClick={() => setEditOpen(true)}>
              <PencilIcon />
              Edit
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p>{product.categoryName ?? 'Uncategorized'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit</p>
              <p>{product.unit}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cost price</p>
              <p className="tabular-nums">{formatMoney(product.costPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Selling price</p>
              <p className="tabular-nums">{formatMoney(product.sellingPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stock on hand</p>
              <p className="flex items-center gap-2 tabular-nums">
                {product.stockOnHand} {product.unit}
                {product.isLowStock && (
                  <Badge variant="outline" style={{ color: STATUS_COLOR_VAR.warning, borderColor: STATUS_COLOR_VAR.warning }}>
                    Low stock
                  </Badge>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reorder level</p>
              <p className="tabular-nums">{product.reorderLevel}</p>
            </div>
            {product.description && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={product.isActive ? 'secondary' : 'outline'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
            <p className="text-xs text-muted-foreground">
              Created {new Date(product.createdAt).toLocaleDateString()} · Updated {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory lots (FIFO order)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductLotsTable lots={product.lots} />
        </CardContent>
      </Card>

      {canEdit && <ProductFormDialog open={editOpen} onOpenChange={setEditOpen} productId={product.id} />}
    </InventoryPageShell>
  );
}
