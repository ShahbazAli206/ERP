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
import { InventoryPageShell } from './inventory-nav';
import { CategoryFormDialog } from './category-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { useCategories, useDeleteCategory } from './hooks';
import { ApiError } from '@/lib/api-client';
import type { Category } from './api';

export function CategoryListView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('inventory:create');
  const canEdit = hasPermission('inventory:edit');
  const canDelete = hasPermission('inventory:delete');

  const categoriesQuery = useCategories();
  const deleteMutation = useDeleteCategory();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const byId = new Map((categoriesQuery.data ?? []).map((c) => [c.id, c]));

  return (
    <InventoryPageShell
      title="Categories"
      description="Product categories used to group and filter the catalog."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Category
          </Button>
        )
      }
    >
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Products</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriesQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : categoriesQuery.data?.length ? (
              categoriesQuery.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.parentId ? (byId.get(category.parentId)?.name ?? '—') : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category.productCount}</Badge>
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
                <TableCell colSpan={4} className="h-56 text-center">
                  <Empty className="border-0 p-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FolderTreeIcon />
                      </EmptyMedia>
                      <EmptyTitle>No categories yet</EmptyTitle>
                      <EmptyDescription>Create a category to start organizing the product catalog.</EmptyDescription>
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
          description={`Delete "${deleteTarget?.name ?? ''}"? Products in this category will become uncategorized rather than being deleted.`}
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
              onError: (error) => setDeleteError(error instanceof ApiError ? error.message : 'Could not delete category'),
            });
          }}
        />
      )}
    </InventoryPageShell>
  );
}
