import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { formatDateTime } from '../format';
import { STATUS_LABELS, STATUS_TONE } from '../status';
import type { StatusHistoryEntry } from '../api';

/**
 * Vertical timeline of a purchase order's `StatusHistory` entries — one dot
 * per status transition with who made it, when, and any note (e.g. a
 * rejection reason). Built scoped to this module rather than as a shared
 * component; see this module's report for whether it's worth promoting.
 */
export function StatusTimeline({ entries }: { entries: StatusHistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No status history yet.</p>;
  }

  // API returns oldest-first already (creation order); show most recent first.
  const ordered = [...entries].reverse();

  return (
    <ol className="space-y-6">
      {ordered.map((entry, index) => {
        const tone = STATUS_TONE[entry.status];
        const color = tone === 'neutral' ? 'var(--muted-foreground)' : STATUS_COLOR_VAR[tone];
        const isLast = index === ordered.length - 1;

        return (
          <li key={`${entry.status}-${entry.changedAt}-${index}`} className="relative flex gap-3 pl-1">
            {!isLast && (
              <span aria-hidden className="absolute top-4 left-[7px] h-[calc(100%+0.5rem)] w-px bg-border" />
            )}
            <span
              aria-hidden
              className="relative z-10 mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-background"
              style={{ backgroundColor: color }}
            />
            <div className="min-w-0 flex-1 space-y-0.5 pb-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{STATUS_LABELS[entry.status]}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {entry.changedByName ? `by ${entry.changedByName}` : 'System'}
              </p>
              {entry.note && (
                <p className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm break-words">{entry.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
