'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useAuth } from '@/features/auth/use-auth';
import { InventoryPageShell } from './inventory-nav';
import { createProductColumns } from './product-columns';
import { ProductFormDialog } from './product-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { useCategories, useDeactivateProduct, useProducts } from './hooks';
import { ApiError } from '@/lib/api-client';
import type { ProductListItem } from './api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function ProductListView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('inventory:create');
  const canEdit = hasPermission('inventory:edit');
  const canDeactivate = hasPermission('inventory:delete');

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [status, setStatus] = useState('all');

  const debouncedSearch = useDebouncedValue(search);

  const [createOpen, setCreateOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ProductListItem | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const sortBy = (sorting[0]?.id as 'name' | 'sku' | 'createdAt' | undefined) ?? 'name';
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'asc';

  const query = useProducts({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    isActive: status === 'all' ? undefined : status === 'active',
    sortBy,
    sortOrder,
  });

  const categoriesQuery = useCategories();
  const deactivateMutation = useDeactivateProduct();

  const columns = useMemo(
    () =>
      createProductColumns({
        canEdit,
        canDeactivate,
        onEdit: (id) => setEditProductId(id),
        onDeactivate: (product) => {
          setDeactivateError(null);
          setDeactivateTarget(product);
        },
      }),
    [canEdit, canDeactivate],
  );

  return (
    <InventoryPageShell
      title="Product Catalog"
      description="SKUs, barcodes, categories, and stock on hand across all warehouses."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Product
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          items={{ all: 'All categories', ...Object.fromEntries((categoriesQuery.data ?? []).map((c) => [c.id, c.name])) }}
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value ?? 'all');
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoriesQuery.data?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option.label]))}
          value={status}
          onValueChange={(value) => {
            setStatus(value ?? 'all');
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        rowCount={query.data?.pagination.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        searchPlaceholder="Search by name, SKU, or barcode..."
        isLoading={query.isLoading}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your search or filters."
        getRowId={(row) => row.id}
      />

      {canCreate && <ProductFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editProductId && (
        <ProductFormDialog open={Boolean(editProductId)} onOpenChange={(open) => !open && setEditProductId(null)} productId={editProductId} />
      )}

      {canDeactivate && (
        <ConfirmDialog
          open={Boolean(deactivateTarget)}
          onOpenChange={(open) => !open && setDeactivateTarget(null)}
          title="Deactivate product"
          description={`Deactivate "${deactivateTarget?.name ?? ''}"? It will be hidden from active-product workflows but its stock and history are kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          errorMessage={deactivateError}
          onConfirm={() => {
            if (!deactivateTarget) return;
            deactivateMutation.mutate(deactivateTarget.id, {
              onSuccess: () => {
                toast.success('Product deactivated');
                setDeactivateTarget(null);
              },
              onError: (error) => setDeactivateError(error instanceof ApiError ? error.message : 'Could not deactivate product'),
            });
          }}
        />
      )}
    </InventoryPageShell>
  );
}
