'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { PlusIcon, TagIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useAuth } from '@/features/auth/use-auth';
import type { DistributorListItem } from './api';
import { createDistributorColumns } from './columns';
import { ConfirmDialog } from './confirm-dialog';
import { useDeactivateDistributor, useDistributorRegions, useDistributors } from './hooks';
import { DistributorFormDialog } from './distributor-form-dialog';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export function DistributorListView() {
  const { hasPermission } = useAuth();

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [status, setStatus] = useState('all');

  const debouncedSearch = useDebouncedValue(search);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDistributorId, setEditDistributorId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<DistributorListItem | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  const canCreate = hasPermission('distributors:create');
  const canEdit = hasPermission('distributors:edit');
  const canDeactivate = hasPermission('distributors:delete');

  const sortBy = (sorting[0]?.id as 'name' | 'region' | 'createdAt' | undefined) ?? 'name';
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'asc';

  const query = useDistributors({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: debouncedSearch || undefined,
    region: region === 'all' ? undefined : region,
    isActive: status === 'all' ? undefined : status === 'active',
    sortBy,
    sortOrder,
  });

  const regionsQuery = useDistributorRegions();
  const deactivateMutation = useDeactivateDistributor();

  // Base UI's `Select.Value` only resolves the closed-trigger label from an
  // `items` map passed to `Select.Root` — without it the trigger shows the
  // raw value ("all") instead of its label until the user opens the popup
  // once. See the README's Next.js 16 gotcha #3.
  const regionItems = useMemo(
    () => ({ all: 'All regions', ...Object.fromEntries((regionsQuery.data ?? []).map((r) => [r, r])) }),
    [regionsQuery.data],
  );
  const statusItems = useMemo(() => Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label])), []);

  const columns = useMemo(
    () =>
      createDistributorColumns({
        canEdit,
        canDeactivate,
        onEdit: (id) => setEditDistributorId(id),
        onDeactivate: (distributor) => {
          setDeactivateError(null);
          setDeactivateTarget(distributor);
        },
      }),
    [canEdit, canDeactivate],
  );

  return (
    <>
      <PageHeader
        title="Distributors"
        description="Distributor accounts, credit limits, and pricing groups."
        actions={
          <>
            <Link href="/distributors/pricing-groups" className={buttonVariants({ variant: 'outline' })}>
              <TagIcon />
              Pricing Groups
            </Link>
            {canCreate && (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon />
                Create Distributor
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={region}
          items={regionItems}
          onValueChange={(value) => {
            setRegion(value ?? 'all');
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regionsQuery.data?.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
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
        searchPlaceholder="Search distributors by name..."
        isLoading={query.isLoading}
        emptyTitle="No distributors found"
        emptyDescription="Try adjusting your search or filters."
        getRowId={(row) => row.id}
      />

      {canCreate && <DistributorFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && (
        <DistributorFormDialog
          open={Boolean(editDistributorId)}
          onOpenChange={(open) => !open && setEditDistributorId(null)}
          distributorId={editDistributorId ?? undefined}
        />
      )}

      {canDeactivate && (
        <ConfirmDialog
          open={Boolean(deactivateTarget)}
          onOpenChange={(open) => !open && setDeactivateTarget(null)}
          title="Deactivate distributor"
          description={`Deactivate ${deactivateTarget?.name ?? 'this distributor'}? It will be hidden from active-distributor workflows but its history is kept.`}
          confirmLabel="Deactivate"
          isPending={deactivateMutation.isPending}
          errorMessage={deactivateError}
          onConfirm={() => {
            if (!deactivateTarget) return;
            deactivateMutation.mutate(deactivateTarget.id, {
              onSuccess: () => {
                toast.success('Distributor deactivated');
                setDeactivateTarget(null);
              },
              onError: () => setDeactivateError('Could not deactivate distributor'),
            });
          }}
        />
      )}
    </>
  );
}
