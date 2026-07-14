import { Badge } from '@/components/ui/badge';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONE,
  STATUS_LABELS,
  STATUS_TONE,
  type InvoiceStatus,
  type SalesOrderStatus,
} from '../status';

/**
 * Status pill for a sales order. Uses the shared good/warning/serious/
 * critical palette (`src/lib/status-colors.ts`) for every status except
 * DRAFT (nothing to flag yet, so it stays a neutral outline badge) — text
 * label is always shown alongside the color per that module's "never rely
 * on color alone" rule.
 */
export function SoStatusBadge({ status, className }: { status: SalesOrderStatus; className?: string }) {
  const tone = STATUS_TONE[status];
  const label = STATUS_LABELS[status];

  if (tone === 'neutral') {
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  }

  const color = STATUS_COLOR_VAR[tone];
  return (
    <Badge
      variant="outline"
      className={className}
      style={{ color, borderColor: color, backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)` }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </Badge>
  );
}

/** Same pattern as `SoStatusBadge`, for `Invoice.status` (ISSUED/PARTIALLY_PAID/PAID/OVERDUE/CANCELLED/DRAFT). */
export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const tone = INVOICE_STATUS_TONE[status];
  const label = INVOICE_STATUS_LABELS[status];

  if (tone === 'neutral') {
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    );
  }

  const color = STATUS_COLOR_VAR[tone];
  return (
    <Badge
      variant="outline"
      className={className}
      style={{ color, borderColor: color, backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)` }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </Badge>
  );
}
