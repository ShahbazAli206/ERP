'use client';

import { useRouter } from 'next/navigation';
import { ArrowRightIcon, CheckIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import { useAdvanceSalesOrder, useCancelSalesOrder, useConfirmSalesOrder, useDeleteSalesOrder } from '../hooks';
import { ADVANCE_LABELS, ADVANCE_TRANSITIONS, CANCELLABLE_STATUSES } from '../status';
import type { SalesOrderDetail } from '../api';
import { ConfirmActionDialog } from './confirm-action-dialog';
import { ConfirmOrderDialog } from './confirm-order-dialog';

/**
 * Status-conditional action bar for the sales order detail page. Every
 * transition here (`confirm`/`advance`/`cancel`/delete) is guarded server-side
 * by `sales:edit` (see `sales.routes.ts`) — there's no separate approve-style
 * permission split the way Procurement has for approve/reject.
 */
export function SoActions({ order }: { order: SalesOrderDetail }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('sales:edit');

  const confirmMutation = useConfirmSalesOrder(order.id);
  const advanceMutation = useAdvanceSalesOrder(order.id);
  const cancelMutation = useCancelSalesOrder(order.id);
  const deleteMutation = useDeleteSalesOrder();

  const nextStatus = ADVANCE_TRANSITIONS[order.status];
  const advanceLabel = ADVANCE_LABELS[order.status];
  const canCancel = canEdit && CANCELLABLE_STATUSES.includes(order.status);

  if (!canEdit) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {order.status === 'DRAFT' && (
        <ConfirmOrderDialog
          trigger={
            <Button size="sm">
              <CheckIcon /> Confirm order
            </Button>
          }
          isPending={confirmMutation.isPending}
          onConfirm={(warehouseId) => confirmMutation.mutateAsync(warehouseId)}
        />
      )}

      {nextStatus && advanceLabel && (
        <ConfirmActionDialog
          trigger={
            <Button size="sm">
              <ArrowRightIcon /> {advanceLabel}
            </Button>
          }
          title={`${advanceLabel}?`}
          description={`This moves the order from ${order.status} to ${nextStatus}.`}
          confirmLabel={advanceLabel}
          isPending={advanceMutation.isPending}
          onConfirm={() => advanceMutation.mutateAsync()}
        />
      )}

      {canCancel && (
        <ConfirmActionDialog
          trigger={
            <Button variant="destructive" size="sm">
              <XIcon /> Cancel order
            </Button>
          }
          title="Cancel this sales order?"
          description={
            order.status === 'DRAFT'
              ? 'This is final — a cancelled order cannot be reopened.'
              : 'This reverses the stock already consumed for this order (restored FIFO) and cannot be undone.'
          }
          confirmLabel="Cancel order"
          confirmVariant="destructive"
          isPending={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutateAsync()}
        />
      )}

      {order.status === 'DRAFT' && (
        <ConfirmActionDialog
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2Icon /> Delete draft
            </Button>
          }
          title="Delete this draft?"
          description="This permanently deletes the draft sales order and its line items."
          confirmLabel="Delete"
          confirmVariant="destructive"
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutateAsync(order.id).then(() => router.push('/sales'))}
        />
      )}
    </div>
  );
}
