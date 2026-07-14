import { z } from 'zod';

/**
 * Frontend mirror of `createSupplierSchema`/`updateSupplierSchema` in
 * `apps/api/src/modules/suppliers/suppliers.validation.ts`. One schema
 * backs both the create and edit dialogs (`supplier-form-dialog.tsx`) since
 * the edit form is always fully pre-populated from the fetched profile, not
 * a partial patch form — `isActive` is only shown/edited in edit mode.
 */
export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  country: z.string().trim().min(1, 'Country is required'),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter ISO currency code (e.g. USD)')
    .regex(/^[A-Za-z]{3}$/, 'Use a 3-letter ISO currency code (e.g. USD)'),
  address: z.string().trim().optional(),
  isActive: z.boolean(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

/** Mirrors `supplierContactSchema`. Empty optional strings are normalized to `undefined` on submit. */
export const supplierContactFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  designation: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email address',
    }),
  phone: z.string().trim().optional(),
});

export type SupplierContactFormValues = z.infer<typeof supplierContactFormSchema>;
