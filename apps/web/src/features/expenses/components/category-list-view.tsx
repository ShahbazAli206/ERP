'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FolderTreeIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/use-auth';
import { ExpensesPageShell } from './expenses-nav';
import { CategoryFormDialog } from './category-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { useDeleteExpenseCategory, useExpenseCategories } from '../hooks';
import { ApiError } from '@/lib/api-client';
import type { ExpenseCategory } from '../api';

/** Friendlier copy for the 409 the API returns when a category still has expenses recorded against it (its `categoryId` FK is non-nullable, unlike Inventory's product categories, so it can't be silently orphaned — the API blocks the delete outright instead). */
function categoryDeleteErrorMessage(error: unknown, categoryName: string): string {
  if (error instanceof ApiError && error.status === 409) {
    return `"${categoryName}" still has expenses recorded against it. Move or delete those expenses before deleting this category.`;
  }
  return error instanceof ApiError ? error.message : 'Could not delete category.';
}

export function CategoryListView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('expenses:create');
  const canEdit = hasPermission('expenses:edit');
  const canDelete = hasPermission('expenses:delete');

  const categoriesQuery = useExpenseCategories();
  const deleteMutation = useDeleteExpenseCategory();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <ExpensesPageShell
      title="Expense Categories"
      description="Categories used to group expenses, e.g. Office Expenses, Marketing, Utilities, Transport, Salaries, Rent."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Category
          </Button>
        )
      }
    >
      <div className="mt-6 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Expenses</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : categoriesQuery.data?.length ? (
              categoriesQuery.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.expenseCount}</Badge>
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(category)} aria-label={`Edit ${category.name}`}>
                            <PencilIcon />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(category);
                            }}
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2Icon />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-56 text-center">
                  <Empty className="border-0 p-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FolderTreeIcon />
                      </EmptyMedia>
                      <EmptyTitle>No categories yet</EmptyTitle>
                      <EmptyDescription>Create a category to start recording expenses.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {canCreate && <CategoryFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editTarget && (
        <CategoryFormDialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)} category={editTarget} />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete category"
          description={`Delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Category deleted');
                setDeleteTarget(null);
              },
              onError: (error) => setDeleteError(categoryDeleteErrorMessage(error, deleteTarget.name)),
            });
          }}
        />
      )}
    </ExpensesPageShell>
  );
}
