import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const journalLineSchema = z.object({
  accountId: z.string().min(1),
  debit: z.number().nonnegative().default(0),
  credit: z.number().nonnegative().default(0),
});

export const createJournalEntrySchema = z.object({
  entryDate: z.coerce.date().optional(),
  description: z.string().optional(),
  reference: z.string().optional(),
  // Double-entry bookkeeping requires at least one debit and one credit line.
  lines: z.array(journalLineSchema).min(2),
});

export const listJournalEntriesQuerySchema = paginationSchema.extend({
  sortBy: z.enum(['entryDate', 'createdAt']).default('entryDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type JournalLineInput = z.infer<typeof journalLineSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type ListJournalEntriesQuery = z.infer<typeof listJournalEntriesQuerySchema>;
