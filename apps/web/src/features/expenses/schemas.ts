import { z } from 'zod';

/** Mirrors `createExpenseCategorySchema` in `apps/api/src/modules/expenses/expenseCategories.validation.ts`. */
export const expenseCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
});
export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;

/**
 * Numeric fields are kept as plain strings at the form layer (native number
 * inputs still hand RHF a string) and validated with a refine, rather than
 * `z.coerce.number()` — coercing schemas give Zod an input type that differs
 * from its output type, which breaks `zodResolver`'s generics when `useForm<T>`
 * is pinned to a single type. Values are converted to numbers only at submit
 * time. Mirrors `features/procurement/schemas.ts`.
 */
function numericString(message: string, predicate: (n: number) => boolean) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)) && predicate(Number(value)), { message });
}

/** Mirrors `createExpenseSchema` — `expenseDate` stays a plain `YYYY-MM-DD` string from the date input and is converted to ISO on submit. */
export const expenseFormSchema = z.object({
  categoryId: z.string().min(1, 'Select a category'),
  amount: numericString('Enter an amount greater than 0', (n) => n > 0),
  expenseDate: z.string().min(1, 'Expense date is required'),
  description: z.string().optional(),
});
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
