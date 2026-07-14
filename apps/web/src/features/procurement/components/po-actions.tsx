'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckIcon, PencilIcon, SendIcon, ShipIcon, Trash2Icon, XIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/use-auth';
import {
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
  useDeletePurchaseOrder,
  useMarkOrderedPurchaseOrder,
  useRejectPurchaseOrder,
  useSubmitPurchaseOrder,
} from '../hooks';
import type { PurchaseOrderDetail } from '../api';
import { ConfirmActionDialog } from './confirm-action-dialog';
import { RejectDialog } from './reject-dialog';

/**
 * Status-conditional action bar for the PO detail page.
 *
 * Permission gating: every action needs `procurement:edit` (the route-level
 * permission for submit/mark-ordered/cancel/delete/edit — see
 * `procurement.routes.ts`) EXCEPT approve/reject, which the API guards with
 * the more specific `procurement:approve` permission — a Procurement Officer
 * has both by default, but a hypothetical role with edit-but-not-approve
 * would see every button except Approve/Reject.
 */
export function PoActions({ po }: { po: PurchaseOrderDetail }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('procurement:edit');
  const canApprove = hasPermission('procurement:approve');

  const submitMutation = useSubmitPurchaseOrder(po.id);
  const approveMutation = useApprovePurchaseOrder(po.id);
  const rejectMutation = useRejectPurchaseOrder(po.id);
  const markOrderedMutation = useMarkOrderedPurchaseOrder(po.id);
  const cancelMutation = useCancelPurchaseOrder(po.id);
  const deleteMutation = useDeletePurchaseOrder();

  const canCancel = canEdit && ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED'].includes(po.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {po.status === 'DRAFT' && canEdit && (
        <Link href={`/procurement/${po.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <PencilIcon /> Edit
        </Link>
      )}

      {po.status === 'DRAFT' && canEdit && (
        <ConfirmActionDialog
          trigger={
            <Button size="sm">
              <SendIcon /> Submit for approval
            </Button>
          }
          title="Submit for approval?"
          description="This moves the purchase order to Pending Approval. It can no longer be edited unless rejected back."
          confirmLabel="Submit"
          isPending={submitMutation.isPending}
          onConfirm={() => submitMutation.mutateAsync()}
        />
      )}

      {po.status === 'PENDING_APPROVAL' && canApprove && (
        <ConfirmActionDialog
          trigger={
            <Button size="sm">
              <CheckIcon /> Approve
            </Button>
          }
          title="Approve this purchase order?"
          description="Approving allows it to be marked as ordered with the supplier."
          confirmLabel="Approve"
          isPending={approveMutation.isPending}
          onConfirm={() => approveMutation.mutateAsync()}
        />
      )}

      {po.status === 'PENDING_APPROVAL' && canApprove && (
        <RejectDialog
          trigger={
            <Button variant="destructive" size="sm">
              <XIcon /> Reject
            </Button>
          }
          isPending={rejectMutation.isPending}
          onConfirm={(reason) => rejectMutation.mutateAsync(reason)}
        />
      )}

      {po.status === 'APPROVED' && canEdit && (
        <ConfirmActionDialog
          trigger={
            <Button size="sm">
              <ShipIcon /> Mark ordered
            </Button>
          }
          title="Mark as ordered?"
          description="Confirms the order has been placed with the supplier. Goods receipt is then handled from the Inventory module."
          confirmLabel="Mark ordered"
          isPending={markOrderedMutation.isPending}
          onConfirm={() => markOrderedMutation.mutateAsync()}
        />
      )}

      {canCancel && (
        <ConfirmActionDialog
          trigger={
            <Button variant="destructive" size="sm">
              <XIcon /> Cancel PO
            </Button>
          }
          title="Cancel this purchase order?"
          description="This is final — a cancelled purchase order cannot be reopened."
          confirmLabel="Cancel PO"
          confirmVariant="destructive"
          isPending={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutateAsync()}
        />
      )}

      {po.status === 'DRAFT' && canEdit && (
        <ConfirmActionDialog
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2Icon /> Delete draft
            </Button>
          }
          title="Delete this draft?"
          description="This permanently deletes the draft purchase order and its line items."
          confirmLabel="Delete"
          confirmVariant="destructive"
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutateAsync(po.id).then(() => router.push('/procurement'))}
        />
      )}
    </div>
  );
}
