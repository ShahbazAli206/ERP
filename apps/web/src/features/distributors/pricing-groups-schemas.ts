import { z } from 'zod';

/**
 * Frontend mirror of `createPricingGroupSchema`/`updatePricingGroupSchema` in
 * `apps/api/src/modules/distributors/pricingGroups.validation.ts`.
 * `discountPercent` uses `z.coerce.number()` for the same reason as
 * `distributors/schemas.ts`'s `creditLimit` — see that file's docstring.
 */
export const pricingGroupFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  discountPercent: z.coerce
    .number({ error: 'Enter a discount percent' })
    .min(0, 'Must be 0 or more')
    .max(100, 'Must be 100 or less'),
});

export type PricingGroupFormInput = z.input<typeof pricingGroupFormSchema>;
export type PricingGroupFormValues = z.output<typeof pricingGroupFormSchema>;
