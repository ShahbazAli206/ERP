import { z } from 'zod';

/**
 * Frontend mirror of `createDistributorSchema`/`updateDistributorSchema` in
 * `apps/api/src/modules/distributors/distributors.validation.ts`. One schema
 * backs both the create and edit dialogs (`distributor-form-dialog.tsx`)
 * since the edit form is always fully pre-populated from the fetched
 * profile — `isActive` is only shown/edited in edit mode. Mirrors
 * `features/suppliers/schemas.ts`.
 *
 * `creditLimit` uses `z.coerce.number()` since a native `<input type="number">`
 * hands React Hook Form a string, not a number — see
 * `features/inventory/schemas.ts` for the same pattern/rationale. That makes
 * this schema's input type (`z.input`, pre-parse) differ from its output
 * type (`z.output`, post-coercion), so `useForm` must be typed
 * `useForm<DistributorFormInput, unknown, DistributorFormValues>`.
 */
export const distributorFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  region: z.string().trim().min(1, 'Region is required'),
  creditLimit: z.coerce.number({ error: 'Enter a credit limit' }).nonnegative('Must be 0 or more'),
  pricingGroupId: z.string().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email address',
    }),
  contactPhone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type DistributorFormInput = z.input<typeof distributorFormSchema>;
export type DistributorFormValues = z.output<typeof distributorFormSchema>;
