import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const createExpenseSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  expenseDate: z.coerce.date().default(() => new Date()),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// Inclusive of the entire "to" day — a bare date string like "2026-07-14" coerces to
// midnight, which would otherwise exclude expenses recorded later that same day (matches
// the same fix applied in the finance module's dateRangeQuerySchema).
const inclusiveToDate = z.coerce.date().transform((d) => {
  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
});

export const listExpensesQuerySchema = paginationSchema.extend({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  from: z.coerce.date().optional(),
  to: inclusiveToDate.optional(),
  sortBy: z.enum(['expenseDate', 'createdAt', 'amount']).default('expenseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const expenseReportQuerySchema = z.object({
  from: z.coerce.date(),
  to: inclusiveToDate,
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type ExpenseReportQuery = z.infer<typeof expenseReportQuerySchema>;
