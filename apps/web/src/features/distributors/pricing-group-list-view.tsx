'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon, TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/page-header';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/features/auth/use-auth';
import { ConfirmDialog } from './confirm-dialog';
import type { PricingGroup } from './pricing-groups-api';
import { PricingGroupFormDialog } from './pricing-group-form-dialog';
import { useDeletePricingGroup, usePricingGroups } from './pricing-groups-hooks';

/**
 * Pricing Groups is a distinct sub-resource of Distributors (its own
 * routes/service/repository in the API), so it lives at its own nested
 * route (`/distributors/pricing-groups`) rather than a tab on the main list
 * page — mirrors how Inventory's Categories/Warehouses sub-resources each
 * get their own nested route off `/inventory`. A small non-paginated Table
 * (not the paginated `DataTable`) is enough since the API returns the full
 * set in one call and the demo only seeds 3 groups.
 */
export function PricingGroupListView() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('distributors:create');
  const canEdit = hasPermission('distributors:edit');
  const canDelete = hasPermission('distributors:delete');

  const query = usePricingGroups();
  const deleteMutation = useDeletePricingGroup();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PricingGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PricingGroup | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2.5 mb-2" onClick={() => router.push('/distributors')}>
          <ArrowLeftIcon />
          Back to distributors
        </Button>
        <PageHeader
          title="Pricing Groups"
          description="Discount tiers distributors can be assigned to."
          actions={
            canCreate && (
              <Button onClick={() => setCreateOpen(true)}>
                <PlusIcon />
                New Pricing Group
              </Button>
            )
          }
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Distributors</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : query.data?.length ? (
              query.data.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="tabular-nums">{group.discountPercent}%</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{group.distributorCount}</Badge>
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditTarget(group)}
                            aria-label={`Edit ${group.name}`}
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
                              setDeleteTarget(group);
                            }}
                            aria-label={`Delete ${group.name}`}
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
                        <TagIcon />
                      </EmptyMedia>
                      <EmptyTitle>No pricing groups yet</EmptyTitle>
                      <EmptyDescription>Create a pricing group to start assigning discount tiers to distributors.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {canCreate && <PricingGroupFormDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {canEdit && editTarget && (
        <PricingGroupFormDialog
          open={Boolean(editTarget)}
          onOpenChange={(open) => !open && setEditTarget(null)}
          pricingGroup={editTarget}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Delete pricing group"
          description={
            deleteTarget && deleteTarget.distributorCount > 0
              ? `Delete "${deleteTarget.name}"? ${deleteTarget.distributorCount} distributor${deleteTarget.distributorCount === 1 ? '' : 's'} currently using this group will be unassigned (set to no pricing group), not blocked from deletion.`
              : `Delete "${deleteTarget?.name ?? ''}"? This can't be undone.`
          }
          confirmLabel="Delete"
          isPending={deleteMutation.isPending}
          errorMessage={deleteError}
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success('Pricing group deleted');
                setDeleteTarget(null);
              },
              onError: (error) => setDeleteError(error instanceof ApiError ? error.message : 'Could not delete pricing group'),
            });
          }}
        />
      )}
    </div>
  );
}
