import { z } from 'zod';

/**
 * Numeric fields are kept as plain strings at the form layer (native number
 * inputs still hand RHF a string) and validated with a refine, rather than
 * `z.coerce.number()` — coercing schemas give Zod an input type (`unknown`/
 * `string`) that differs from its output type (`number`), which breaks
 * `zodResolver`'s generics when `useForm<T>` is pinned to a single type.
 * Values are converted to numbers only at submit time (see each page's
 * submit handler), right before they're sent to the typed `CreatePurchaseOrderInput`.
 */
function numericString(message: string, predicate: (n: number) => boolean) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)) && predicate(Number(value)), { message });
}

/** Mirrors `purchaseOrderItemSchema` in `apps/api/src/modules/procurement/procurement.validation.ts`. */
export const purchaseOrderItemFormSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: numericString('Enter a whole number greater than 0', (n) => Number.isInteger(n) && n > 0),
  unitPrice: numericString('Enter a non-negative price', (n) => n >= 0),
});

/** Mirrors `createPurchaseOrderSchema` — `expectedArrival` stays a plain `YYYY-MM-DD` string from the date input and is converted to ISO on submit. */
export const purchaseOrderFormSchema = z.object({
  supplierId: z.string().min(1, 'Select a supplier'),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code (e.g. USD)')
    .transform((value) => value.toUpperCase()),
  exchangeRateToBase: numericString('Enter a rate greater than 0', (n) => n > 0),
  expectedArrival: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemFormSchema).min(1, 'Add at least one line item'),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

/** Mirrors `rejectPurchaseOrderSchema`. */
export const rejectFormSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required'),
});

export type RejectFormValues = z.infer<typeof rejectFormSchema>;
