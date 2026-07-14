import { z } from 'zod';

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
