import type { StatusTone } from '@/lib/status-colors';

/**
 * The sales order status machine (mirrors `SalesOrderStatus` in
 * `apps/api/src/generated/prisma/enums.ts`):
 *
 *   DRAFT -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
 *              |              |            |
 *              v              v            v
 *                        CANCELLED  (also reachable from DRAFT)
 *
 * Confirming a DRAFT order consumes stock FIFO from a chosen warehouse
 * (`POST /sales/orders/:id/confirm`); cancelling a CONFIRMED/PROCESSING order
 * reverses that consumption. Advancing (CONFIRMED->PROCESSING->SHIPPED->DELIVERED)
 * is a plain status flip with no stock effect.
 */
export const SO_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type SalesOrderStatus = (typeof SO_STATUSES)[number];

export const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** `neutral` falls outside the fixed good/warning/serious/critical palette (see `src/lib/status-colors.ts`) for the "nothing to flag yet" DRAFT state. */
export const STATUS_TONE: Record<SalesOrderStatus, StatusTone | 'neutral'> = {
  DRAFT: 'neutral',
  CONFIRMED: 'good',
  PROCESSING: 'warning',
  SHIPPED: 'warning',
  DELIVERED: 'good',
  CANCELLED: 'serious',
};

/** Mirrors `salesOrders.service.ts`'s `ADVANCE_TRANSITIONS` — what "advance" does next, per current status. */
export const ADVANCE_TRANSITIONS: Partial<Record<SalesOrderStatus, SalesOrderStatus>> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export const ADVANCE_LABELS: Partial<Record<SalesOrderStatus, string>> = {
  CONFIRMED: 'Mark Processing',
  PROCESSING: 'Mark Shipped',
  SHIPPED: 'Mark Delivered',
};

/** Mirrors `CANCELLABLE_STATUSES` in `salesOrders.service.ts`. */
export const CANCELLABLE_STATUSES: SalesOrderStatus[] = ['DRAFT', 'CONFIRMED', 'PROCESSING'];

/** Mirrors `STOCK_CONSUMED_STATUSES` — cancelling from here reverses FIFO stock consumption. */
export const STOCK_CONSUMED_STATUSES: SalesOrderStatus[] = ['CONFIRMED', 'PROCESSING'];

/** Mirrors `RETURNABLE_STATUSES` in `returns.service.ts`. */
export const RETURNABLE_STATUSES: SalesOrderStatus[] = ['SHIPPED', 'DELIVERED'];

/** Mirrors `NOT_INVOICEABLE_STATUSES` in `invoices.service.ts` — everything else can be invoiced. */
export const NOT_INVOICEABLE_STATUSES: SalesOrderStatus[] = ['DRAFT', 'CANCELLED'];

export const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, StatusTone | 'neutral'> = {
  DRAFT: 'neutral',
  ISSUED: 'warning',
  PARTIALLY_PAID: 'warning',
  PAID: 'good',
  OVERDUE: 'critical',
  CANCELLED: 'serious',
};

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  CARD: 'Card',
  OTHER: 'Other',
};
