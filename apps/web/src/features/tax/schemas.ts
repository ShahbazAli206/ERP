import { z } from 'zod';

/** Mirrors `taxTypeEnum` in `apps/api/src/modules/tax/tax.validation.ts`. */
export const TAX_TYPE_OPTIONS: { value: 'GST' | 'SALES_TAX' | 'WITHHOLDING_TAX'; label: string }[] = [
  { value: 'GST', label: 'GST' },
  { value: 'SALES_TAX', label: 'Sales Tax' },
  { value: 'WITHHOLDING_TAX', label: 'Withholding Tax' },
];

/**
 * Frontend mirror of `createTaxSchema`/`updateTaxSchema`. One schema backs both the create and
 * edit dialogs — the edit form is always fully pre-populated from the row's own list data (the
 * list already returns every field a tax rate has, unlike suppliers' address-only profile gap),
 * not a partial patch form.
 *
 * `rate` uses `z.coerce.number()` since native `<input type="number">` always hands RHF a string.
 * Coercing schemas give Zod an input type (`unknown`) that differs from its output type
 * (`number`), so this exports both a `TaxRateFormInput` (`z.input`, pre-parse — what
 * `defaultValues` and field `name`s are typed against) and a `TaxRateFormValues` (`z.output`,
 * post-coercion — what the submit handler receives); callers use
 * `useForm<TaxRateFormInput, unknown, TaxRateFormValues>(...)`. Mirrors
 * `src/features/inventory/schemas.ts` / `src/features/shipments/schemas.ts`, the first modules in
 * this repo to hit the same issue.
 */
export const taxRateFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  type: z.enum(['GST', 'SALES_TAX', 'WITHHOLDING_TAX'], { error: 'Select a tax type' }),
  rate: z.coerce
    .number({ error: 'Enter a rate' })
    .min(0, 'Must be 0 or more')
    .max(100, 'Enter a percent (0-100)'),
  appliesTo: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type TaxRateFormInput = z.input<typeof taxRateFormSchema>;
export type TaxRateFormValues = z.output<typeof taxRateFormSchema>;
