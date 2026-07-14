import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { SHIPMENT_STATUS_TONE } from './status';
import { ShipmentStatusBadge } from './shipment-status-badge';
import type { ShipmentDetail } from './api';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function dotColor(status: string): string {
  const tone = SHIPMENT_STATUS_TONE[status as keyof typeof SHIPMENT_STATUS_TONE] ?? 'neutral';
  return tone === 'neutral' ? 'var(--muted-foreground)' : STATUS_COLOR_VAR[tone];
}

/**
 * Vertical status-walk timeline for a shipment's `statusHistory` — every
 * transition the shipment has been through, in order, including any
 * `DELAYED` excursions (they show up inline exactly where they occurred,
 * distinguished by the DELAYED badge's critical tone + icon).
 */
export function ShipmentTimeline({ history }: { history: ShipmentDetail['statusHistory'] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No status history yet.</p>;
  }

  return (
    <ol className="relative space-y-6 border-l-2 border-border pl-6">
      {history.map((entry, index) => (
        <li key={`${entry.status}-${entry.changedAt}-${index}`} className="relative">
          <span
            className="absolute top-1 -left-[calc(1.5rem+5px)] size-3 rounded-full ring-4 ring-background"
            style={{ backgroundColor: dotColor(entry.status) }}
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-2">
            <ShipmentStatusBadge status={entry.status} />
            <span className="text-sm text-muted-foreground">{formatDateTime(entry.changedAt)}</span>
          </div>
          {entry.changedByName && (
            <p className="mt-1 text-xs text-muted-foreground">by {entry.changedByName}</p>
          )}
          {entry.note && <p className="mt-1 text-sm">{entry.note}</p>}
        </li>
      ))}
    </ol>
  );
}
