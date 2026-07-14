import type { StatusTone } from '@/lib/status-colors';

/**
 * The procurement status machine (mirrors `PurchaseOrderStatus` in
 * `apps/api/src/generated/prisma/enums.ts`):
 *
 *   DRAFT -> PENDING_APPROVAL -> APPROVED -> ORDERED -> PARTIALLY_RECEIVED -> RECEIVED
 *              |                    |
 *              v                    v
 *          REJECTED             CANCELLED  (also reachable from DRAFT/PENDING_APPROVAL/ORDERED)
 *
 * Goods receipt (PARTIALLY_RECEIVED -> RECEIVED) is driven by the Inventory
 * module against this PO; Procurement only displays that progress.
 */
export const PO_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'ORDERED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED',
] as const;

export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

/** `neutral` falls outside the fixed good/warning/serious/critical palette (see `src/lib/status-colors.ts`) for the "nothing to flag yet" DRAFT state. */
export const STATUS_TONE: Record<PurchaseOrderStatus, StatusTone | 'neutral'> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'good',
  REJECTED: 'critical',
  ORDERED: 'good',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'good',
  CANCELLED: 'serious',
};

/** Source statuses each transition endpoint accepts — mirrors `procurement.service.ts`'s `assertStatus` calls exactly. */
export const ALLOWED_SOURCE_STATUSES = {
  submit: ['DRAFT'] as PurchaseOrderStatus[],
  approve: ['PENDING_APPROVAL'] as PurchaseOrderStatus[],
  reject: ['PENDING_APPROVAL'] as PurchaseOrderStatus[],
  markOrdered: ['APPROVED'] as PurchaseOrderStatus[],
  cancel: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED'] as PurchaseOrderStatus[],
  edit: ['DRAFT'] as PurchaseOrderStatus[],
  delete: ['DRAFT'] as PurchaseOrderStatus[],
};
