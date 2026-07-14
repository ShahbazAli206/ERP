import { Badge } from '@/components/ui/badge';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { STATUS_LABELS, STATUS_TONE, type PurchaseOrderStatus } from '../status';

/**
 * Status pill for a purchase order. Uses the shared good/warning/serious/
 * critical palette (`src/lib/status-colors.ts`) for every status except
 * DRAFT (nothing to flag yet, so it stays a neutral outline badge) — text
 * label is always shown alongside the color per that module's "never rely
 * on color alone" rule.
 */
export function PoStatusBadge({ status, className }: { status: PurchaseOrderStatus; className?: string }) {
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
