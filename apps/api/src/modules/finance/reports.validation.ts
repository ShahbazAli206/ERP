import { z } from 'zod';

export const dateRangeQuerySchema = z.object({
  from: z.coerce.date(),
  // Inclusive of the entire "to" day — a bare date string like "2026-07-14" coerces to
  // midnight, which would otherwise exclude everything that happened later that day.
  to: z.coerce.date().transform((d) => {
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
