'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/data-table';
import { useAuth } from '@/features/auth/use-auth';
import { FinancePageShell } from './finance-nav';
import { createAccountColumns } from './account-columns';
import { AccountFormDialog } from './account-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { ACCOUNT_TYPE_OPTIONS } from './schemas';
import { useAccounts, useDeleteAccount } from './hooks';
import { ApiError } from '@/lib/api-client';
import type { Account, AccountType } from './api';

const TYPE_FILTER_OPTIONS = [{ value: 'all', label: 'All types' }, ...ACCOUNT_TYPE_OPTIONS];

export function AccountsListView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('finance:create');
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortBy = (sorting[0]?.id as 'code' | 'name' | undefined) ?? 'code';
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'asc';

  const query = useAccounts({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    type: typeFilter === 'all' ? undefined : (typeFilter as AccountType),
    sortBy,
    sortOrder,
  });
  const deleteMutation = useDeleteAccount();

  // `items` is required, not cosmetic — Base UI's `<Select.Value>` uses it to resolve the
  // closed-trigger label; without it the trigger falls back to the raw value ("all")
  // instead of "All types" once the popup unmounts.
  const typeFilterItems = useMemo(() => Object.fromEntries(TYPE_FILTER_OPTIONS.map((o) => [o.value, o.label])), []);

  const columns = useMemo(
    () =>
      createAccountColumns({
        canEdit,
        canDelete,
        onEdit: (account) => setEditTarget(account),
        onDelete: (account) => {
          setDeleteError(null);
          setDeleteTarget(account);
        },
      }),
    [canEdit, canDelete],
  );

  return (
    <FinancePageShell
      title="Chart of Accounts"
      description="The full ledger account list — asset, liability, equity, income, and expense accounts."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Account
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={typeFilter}
          items={typeFilterItems}
          onValueChange={(value) => {
            setTypeFilter(value ?? 'all');
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTER_OPTIONS.map((option) => (
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
        isLoading={query.isLoading}
        emptyTitle="No accounts found"
        emptyDescription="Try a different type filter, or create a new account."
        getRowId={(row) => row.id}
      />

      {canCreate && <AccountFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editTarget && (
        <AccountFormDialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)} account={editTarget} />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete account"
          description={`Delete "${deleteTarget?.code} — ${deleteTarget?.name}"? Any journal entry lines referencing it may fail to load correctly afterward.`}
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Account deleted');
                setDeleteTarget(null);
              },
              onError: (error) => setDeleteError(error instanceof ApiError ? error.message : 'Could not delete account'),
            });
          }}
        />
      )}
    </FinancePageShell>
  );
}
