import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const createBankAccountSchema = z.object({
  name: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  currency: z.string().length(3),
  balance: z.number().default(0),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

export const listBankAccountsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'bankName', 'balance']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
export type ListBankAccountsQuery = z.infer<typeof listBankAccountsQuerySchema>;
