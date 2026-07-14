'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginationState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { useAuth } from '@/features/auth/use-auth';
import type { TaxRate, TaxType } from './api';
import { createTaxRateColumns } from './tax-rate-columns';
import { ConfirmDialog } from './confirm-dialog';
import { TAX_TYPE_OPTIONS } from './schemas';
import { useDeleteTaxRate, useTaxRates } from './hooks';
import { TaxRateFormDialog } from './tax-rate-form-dialog';

const TYPE_OPTIONS = [{ value: 'all', label: 'All types' }, ...TAX_TYPE_OPTIONS];
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/**
 * Tax rates CRUD list. `GET /tax` (`listTaxesQuerySchema` in `tax.validation.ts`) only accepts
 * `type`/`isActive` filters — no `search`/`sortBy`, unlike suppliers — so the table is rendered
 * without search or sortable columns; the backend always orders by name ascending.
 */
export function TaxRateListView() {
  const { hasPermission } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null);

  const canCreate = hasPermission('tax:create');
  const canEdit = hasPermission('tax:edit');
  const canDelete = hasPermission('tax:delete');

  const query = useTaxRates({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    type: type === 'all' ? undefined : (type as TaxType),
    isActive: status === 'all' ? undefined : status === 'active',
  });

  const deleteMutation = useDeleteTaxRate();

  const typeItems = useMemo(() => Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label])), []);
  const statusItems = useMemo(() => Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label])), []);

  const columns = useMemo(
    () =>
      createTaxRateColumns({
        canEdit,
        canDelete,
        onEdit: (id) => {
          const tax = query.data?.data.find((t) => t.id === id) ?? null;
          setEditingTax(tax);
        },
        onDelete: (tax) => setDeleteTarget(tax),
      }),
    [canEdit, canDelete, query.data?.data],
  );

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={type}
              items={typeItems}
              onValueChange={(value) => {
                setType(value ?? 'all');
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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

          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Create Tax Rate
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          rowCount={query.data?.pagination.total ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          isLoading={query.isLoading}
          emptyTitle="No tax rates found"
          emptyDescription="Try adjusting your filters, or create a new tax rate."
          getRowId={(row) => row.id}
        />
      </div>

      {canCreate && <TaxRateFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && (
        <TaxRateFormDialog
          open={Boolean(editingTax)}
          onOpenChange={(open) => !open && setEditingTax(null)}
          editingTax={editingTax}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete tax rate"
          description={`Permanently delete "${deleteTarget?.name ?? 'this tax rate'}"? This is a hard delete with no undo — it will be removed entirely, not just deactivated.`}
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Tax rate deleted');
                setDeleteTarget(null);
              },
              onError: () => toast.error('Could not delete tax rate'),
            });
          }}
        />
      )}
    </>
  );
}
