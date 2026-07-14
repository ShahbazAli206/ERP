'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useAuth } from '@/features/auth/use-auth';
import type { SupplierListItem } from './api';
import { createSupplierColumns } from './columns';
import { ConfirmDialog } from './confirm-dialog';
import { useDeactivateSupplier, useSupplierCountries, useSuppliers } from './hooks';
import { SupplierFormDialog } from './supplier-form-dialog';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function SupplierListView() {
  const { hasPermission } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [status, setStatus] = useState('all');

  const debouncedSearch = useDebouncedValue(search);

  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<SupplierListItem | null>(null);

  const canCreate = hasPermission('suppliers:create');
  const canEdit = hasPermission('suppliers:edit');
  const canDeactivate = hasPermission('suppliers:delete');

  const sortBy = (sorting[0]?.id as 'name' | 'country' | 'createdAt' | undefined) ?? 'createdAt';
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

  const query = useSuppliers({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    country: country === 'all' ? undefined : country,
    isActive: status === 'all' ? undefined : status === 'active',
    sortBy,
    sortOrder,
  });

  const countriesQuery = useSupplierCountries();
  const deactivateMutation = useDeactivateSupplier();

  // Base UI's `Select.Value` only resolves the closed-trigger label from an
  // `items` map passed to `Select.Root` (or from `Select.Item`s that have
  // already been mounted at least once) — without it, the trigger shows the
  // raw value ("all") instead of its label ("All countries") until the user
  // opens the popup once. Passing `items` here fixes that on first render.
  const countryItems = useMemo(
    () => ({ all: 'All countries', ...Object.fromEntries((countriesQuery.data ?? []).map((c) => [c, c])) }),
    [countriesQuery.data],
  );
  const statusItems = useMemo(() => Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label])), []);

  const columns = useMemo(
    () =>
      createSupplierColumns({
        canEdit,
        canDeactivate,
        onEdit: (id) => setEditSupplierId(id),
        onDeactivate: (supplier) => setDeactivateTarget(supplier),
      }),
    [canEdit, canDeactivate],
  );

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Supplier profiles, contacts, and purchase history."
        actions={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Create Supplier
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={country}
          items={countryItems}
          onValueChange={(value) => {
            setCountry(value ?? 'all');
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countriesQuery.data?.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          items={statusItems}
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
        searchPlaceholder="Search suppliers by name..."
        isLoading={query.isLoading}
        emptyTitle="No suppliers found"
        emptyDescription="Try adjusting your search or filters."
        getRowId={(row) => row.id}
      />

      {canCreate && <SupplierFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && (
        <SupplierFormDialog
          open={Boolean(editSupplierId)}
          onOpenChange={(open) => !open && setEditSupplierId(null)}
          supplierId={editSupplierId ?? undefined}
        />
      )}

      {canDeactivate && (
        <ConfirmDialog
          open={Boolean(deactivateTarget)}
          onOpenChange={(open) => !open && setDeactivateTarget(null)}
          title="Deactivate supplier"
          description={`Deactivate ${deactivateTarget?.name ?? 'this supplier'}? It will be hidden from active-supplier workflows but its history is kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          onConfirm={() => {
            if (!deactivateTarget) return;
            deactivateMutation.mutate(deactivateTarget.id, {
              onSuccess: () => {
                toast.success('Supplier deactivated');
                setDeactivateTarget(null);
              },
              onError: () => toast.error('Could not deactivate supplier'),
            });
          }}
        />
      )}
    </>
  );
}
