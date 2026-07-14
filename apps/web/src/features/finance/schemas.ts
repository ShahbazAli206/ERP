import { z } from 'zod';

/**
 * Zod schemas mirroring `apps/api/src/modules/finance/*.validation.ts`.
 *
 * Numeric fields use `z.coerce.number()` since native `<input type="number">`
 * elements hand React Hook Form a string — this gives Zod an input type that
 * differs from its output type, which breaks `zodResolver`'s generics if
 * `useForm` is pinned to a single type. Every schema with a coerced field
 * therefore exports both a `*FormInput` (`z.input`, pre-parse — what
 * `defaultValues` and field `name`s are typed against) and a `*FormValues`
 * (`z.output`, post-coercion — what the submit handler receives), and callers
 * use `useForm<Input, unknown, Output>(...)`. Mirrors `features/inventory/schemas.ts`
 * and `features/shipments/schemas.ts`.
 */

/** Turns an empty `<input type="date">` string into `undefined` instead of an Invalid Date. */
const optionalDateInput = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? undefined : value),
  z.coerce.date().optional(),
);

// ── Bank accounts ────────────────────────────────────────────────────────────

export const bankAccountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  bankName: z.string().trim().min(1, 'Bank name is required'),
  accountNumber: z.string().trim().min(1, 'Account number is required'),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code, e.g. PKR')
    .transform((value) => value.toUpperCase()),
  balance: z.coerce.number({ error: 'Enter a number' }).nonnegative('Must be 0 or more').default(0),
});
export type BankAccountFormInput = z.input<typeof bankAccountSchema>;
export type BankAccountFormValues = z.output<typeof bankAccountSchema>;

// ── Chart of accounts ────────────────────────────────────────────────────────

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
] as const;

export const accountSchema = z.object({
  code: z.string().trim().min(1, 'Code is required'),
  name: z.string().trim().min(1, 'Name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'], { error: 'Select a type' }),
});
export type AccountFormValues = z.infer<typeof accountSchema>;

// ── Journal entries ──────────────────────────────────────────────────────────

export const journalLineFormSchema = z.object({
  accountId: z.string().min(1, 'Select an account'),
  debit: z.coerce.number({ error: 'Enter a number' }).nonnegative('Must be 0 or more').default(0),
  credit: z.coerce.number({ error: 'Enter a number' }).nonnegative('Must be 0 or more').default(0),
});

// Float-comparison epsilon mirrors the API's `journalEntries.service.ts` `BALANCE_EPSILON` —
// this schema should reject the same unbalanced entries the API would, but earlier.
const BALANCE_EPSILON = 0.01;

export const createJournalEntrySchema = z
  .object({
    entryDate: optionalDateInput,
    description: z.string().trim().optional(),
    reference: z.string().trim().optional(),
    lines: z.array(journalLineFormSchema).min(2, 'A journal entry needs at least 2 lines'),
  })
  .superRefine((data, ctx) => {
    data.lines.forEach((line, index) => {
      const hasDebit = line.debit > 0;
      const hasCredit = line.credit > 0;
      if (!hasDebit && !hasCredit) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a debit or credit amount',
          path: ['lines', index, 'debit'],
        });
      } else if (hasDebit && hasCredit) {
        ctx.addIssue({
          code: 'custom',
          message: 'A line can have a debit or a credit, not both',
          path: ['lines', index, 'debit'],
        });
      }
    });

    const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > BALANCE_EPSILON) {
      ctx.addIssue({
        code: 'custom',
        message: `Debits (${totalDebit.toFixed(2)}) must equal credits (${totalCredit.toFixed(2)}) — off by ${Math.abs(totalDebit - totalCredit).toFixed(2)}`,
        path: ['lines'],
      });
    }
  });

export type CreateJournalEntryFormInput = z.input<typeof createJournalEntrySchema>;
export type CreateJournalEntryFormValues = z.output<typeof createJournalEntrySchema>;

// ── Report date-range filters ────────────────────────────────────────────────

export const dateRangeFilterSchema = z
  .object({
    from: z.string().min(1, 'Start date is required'),
    to: z.string().min(1, 'End date is required'),
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: 'Start date must be before the end date',
    path: ['to'],
  });
export type DateRangeFilterValues = z.infer<typeof dateRangeFilterSchema>;
