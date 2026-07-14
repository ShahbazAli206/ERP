'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { PencilIcon, PlusIcon, Trash2Icon, WarehouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/use-auth';
import { InventoryPageShell } from './inventory-nav';
import { WarehouseFormDialog } from './warehouse-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { useDeleteWarehouse, useWarehouses } from './hooks';
import { ApiError } from '@/lib/api-client';
import type { Warehouse } from './api';

export function WarehouseListView() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('inventory:create');
  const canEdit = hasPermission('inventory:edit');
  const canDelete = hasPermission('inventory:delete');

  const warehousesQuery = useWarehouses();
  const deleteMutation = useDeleteWarehouse();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <InventoryPageShell
      title="Warehouses"
      description="Storage locations that hold inventory lots."
      actions={
        canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Warehouse
          </Button>
        )
      }
    >
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehousesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : warehousesQuery.data?.length ? (
              warehousesQuery.data.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">{warehouse.name}</TableCell>
                  <TableCell className="text-muted-foreground">{warehouse.location ?? '—'}</TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditTarget(warehouse)}
                            aria-label={`Edit ${warehouse.name}`}
                          >
                            <PencilIcon />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(warehouse);
                            }}
                            aria-label={`Delete ${warehouse.name}`}
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
                        <WarehouseIcon />
                      </EmptyMedia>
                      <EmptyTitle>No warehouses yet</EmptyTitle>
                      <EmptyDescription>Create a warehouse before recording goods receipts.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {canCreate && <WarehouseFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editTarget && (
        <WarehouseFormDialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)} warehouse={editTarget} />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete warehouse"
          description={`Delete "${deleteTarget?.name ?? ''}"? This isn't possible while it still holds inventory lots.`}
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Warehouse deleted');
                setDeleteTarget(null);
              },
              onError: (error) => setDeleteError(error instanceof ApiError ? error.message : 'Could not delete warehouse'),
            });
          }}
        />
      )}
    </InventoryPageShell>
  );
}
