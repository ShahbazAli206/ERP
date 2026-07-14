'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { PaginationState, SortingState } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/data-table';
import { useAuth } from '@/features/auth/use-auth';
import { FinancePageShell } from './finance-nav';
import { createBankAccountColumns } from './bank-account-columns';
import { BankAccountFormDialog } from './bank-account-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { useBankAccounts, useDeleteBankAccount } from './hooks';
import { ApiError } from '@/lib/api-client';
import type { BankAccount } from './api';

export function BankAccountsListView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('finance:create');
  const canEdit = hasPermission('finance:edit');
  const canDelete = hasPermission('finance:delete');

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortBy = (sorting[0]?.id as 'name' | 'bankName' | 'balance' | undefined) ?? 'name';
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : 'asc';

  const query = useBankAccounts({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    sortBy,
    sortOrder,
  });
  const deleteMutation = useDeleteBankAccount();

  const columns = useMemo(
    () =>
      createBankAccountColumns({
        canEdit,
        canDelete,
        onEdit: (bankAccount) => setEditTarget(bankAccount),
        onDelete: (bankAccount) => {
          setDeleteError(null);
          setDeleteTarget(bankAccount);
        },
      }),
    [canEdit, canDelete],
  );

  return (
    <FinancePageShell
      title="Bank Accounts"
      description="Bank accounts backing the company's cash position."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Bank Account
          </Button>
        )
      }
    >
      <DataTable
        columns={columns}
        data={query.data?.data ?? []}
        rowCount={query.data?.pagination.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        isLoading={query.isLoading}
        emptyTitle="No bank accounts yet"
        emptyDescription="Add a bank account to start tracking the cash position."
        getRowId={(row) => row.id}
      />

      {canCreate && <BankAccountFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editTarget && (
        <BankAccountFormDialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)} bankAccount={editTarget} />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete bank account"
          description={`Delete "${deleteTarget?.name ?? ''}"? This removes it from the cash position total.`}
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Bank account deleted');
                setDeleteTarget(null);
              },
              onError: (error) => setDeleteError(error instanceof ApiError ? error.message : 'Could not delete bank account'),
            });
          }}
        />
      )}
    </FinancePageShell>
  );
}
