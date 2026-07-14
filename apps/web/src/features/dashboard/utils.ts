import type { StatusTone } from '@/lib/status-colors';

/**
 * Formatting/labeling helpers local to the Dashboard page. Not promoted to `src/lib/` per the
 * Phase 8 boundary rules (only touch `features/dashboard/` + `app/(app)/dashboard/`) — the
 * system's base currency is PKR (see `apps/api/src/modules/settings/companySettings.service.ts`
 * and the seed data), so these are dashboard-local rather than a shared `formatCurrency` util.
 */

const compactCurrencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const fullCurrencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** Short form for tight spaces (StatCard tiles, axis ticks) — e.g. "₨575.0M". */
export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

/** Full grouped form for tooltips and anywhere precision matters. */
export function formatCurrencyFull(value: number): string {
  return fullCurrencyFormatter.format(value);
}

/** Plain counts (low stock, shipments, POs) don't need currency, just grouping past 4 digits. */
export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

/** "2026-07" -> "Jul 2026", for chart X-axis ticks. */
export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split('-');
  if (!year || !monthNum) return month;
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "3 hours ago" / "2 days ago" style relative timestamp for the activity feed. */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const diffSec = Math.round(diffMs / 1000);
  const units: Array<[string, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secondsInUnit] of units) {
    const count = Math.floor(diffSec / secondsInUnit);
    if (count >= 1) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
  }
  return diffSec <= 5 ? 'just now' : `${diffSec} seconds ago`;
}

const ENTITY_TYPE_LABEL: Record<string, string> = {
  PurchaseOrder: 'Purchase order',
  Shipment: 'Shipment',
  SalesOrder: 'Sales order',
};

/** "Purchase order PO-2026-0042" / falls back to the raw entity type if unmapped. */
export function activityTitle(entityType: string, referenceLabel: string | null): string {
  const label = ENTITY_TYPE_LABEL[entityType] ?? entityType;
  return referenceLabel ? `${label} ${referenceLabel}` : label;
}

/**
 * Maps every PurchaseOrderStatus/ShipmentStatus/SalesOrderStatus value (see
 * `apps/api/prisma/schema.prisma`) to the fixed good/warning/serious/critical status palette —
 * never a chart color. DRAFT/BOOKED-type "not yet in motion" statuses read as neutral rather
 * than forcing them into one of the four tones.
 */
const STATUS_TONE: Record<string, StatusTone> = {
  // Purchase orders
  APPROVED: 'good',
  RECEIVED: 'good',
  PENDING_APPROVAL: 'warning',
  ORDERED: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  REJECTED: 'critical',
  CANCELLED: 'critical',
  // Shipments
  ARRIVED_AT_PORT: 'good',
  DELIVERED: 'good',
  IN_TRANSIT: 'warning',
  CUSTOMS_CLEARANCE: 'warning',
  BOOKED: 'warning',
  DELAYED: 'serious',
  // Sales orders
  CONFIRMED: 'good',
  SHIPPED: 'warning',
  PROCESSING: 'warning',
};

export function statusTone(status: string): StatusTone | null {
  return STATUS_TONE[status] ?? null;
}

/** Truncates a long product/supplier/distributor name for a Y-axis category tick; full name stays in the tooltip. */
export function truncateLabel(text: string, max = 16): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Title-cases a SCREAMING_SNAKE_CASE status enum for display, e.g. "PARTIALLY_RECEIVED" -> "Partially received". */
export function formatStatusLabel(status: string): string {
  const lower = status.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
