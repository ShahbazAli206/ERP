import { z } from 'zod';

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Optional ?from&to date-range query, defaulting to a trailing 12-month window (first day of
 * the month 11 months ago through the end of today) when omitted — used by /kpis and the
 * sales-by-category chart. Mirrors finance/reports.validation.ts's end-of-day-inclusive `to`
 * handling so a bare date like "2026-07-14" doesn't exclude same-day records.
 */
export const dashboardRangeQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .transform(({ from, to }) => {
    const resolvedTo = to ? endOfDay(to) : new Date();
    const resolvedFrom = from ?? new Date(resolvedTo.getFullYear(), resolvedTo.getMonth() - 11, 1);
    return { from: resolvedFrom, to: resolvedTo };
  });

export type DashboardRangeQuery = z.infer<typeof dashboardRangeQuerySchema>;
