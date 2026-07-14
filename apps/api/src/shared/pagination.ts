import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function toSkipTake(pagination: PaginationInput) {
  return { skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize };
}

export const booleanQueryParam = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));
