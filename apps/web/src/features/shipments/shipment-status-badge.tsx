import {
  AnchorIcon,
  CheckCircle2Icon,
  FileCheckIcon,
  PackageIcon,
  TriangleAlertIcon,
  TruckIcon,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { cn } from '@/lib/utils';
import { SHIPMENT_STATUS_TONE, shipmentStatusLabel } from './status';

/**
 * Per-status icon so the badge never relies on color alone (see
 * `src/lib/status-colors.ts`'s contrast caveat) — each of the six shipment
 * statuses gets a distinct glyph in addition to its tone color and text label.
 */
const STATUS_ICON: Record<string, LucideIcon> = {
  BOOKED: PackageIcon,
  IN_TRANSIT: TruckIcon,
  ARRIVED_AT_PORT: AnchorIcon,
  CUSTOMS_CLEARANCE: FileCheckIcon,
  DELAYED: TriangleAlertIcon,
  DELIVERED: CheckCircle2Icon,
};

export function ShipmentStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = SHIPMENT_STATUS_TONE[status as keyof typeof SHIPMENT_STATUS_TONE] ?? 'neutral';
  const label = shipmentStatusLabel(status);
  const Icon = STATUS_ICON[status] ?? PackageIcon;

  if (tone === 'neutral') {
    return (
      <Badge variant="secondary" className={cn('gap-1.5', className)}>
        <Icon />
        {label}
      </Badge>
    );
  }

  const colorVar = STATUS_COLOR_VAR[tone];

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 border-transparent', className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${colorVar} 16%, transparent)`,
        color: colorVar,
      }}
    >
      <Icon />
      {label}
    </Badge>
  );
}
