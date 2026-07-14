import { z } from 'zod';
import { AccountType } from '../../generated/prisma/enums';
import { paginationSchema } from '../../shared/pagination';

export const createAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
});

export const updateAccountSchema = createAccountSchema.partial();

export const listAccountsQuerySchema = paginationSchema.extend({
  type: z.nativeEnum(AccountType).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['code', 'name']).default('code'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type ListAccountsQuery = z.infer<typeof listAccountsQuerySchema>;
