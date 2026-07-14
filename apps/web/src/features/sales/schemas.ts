import { z } from 'zod';
import { PAYMENT_METHODS } from './status';

/**
 * Numeric fields are kept as plain strings at the form layer (native number
 * inputs still hand RHF a string) and validated with a refine, rather than
 * `z.coerce.number()` — coercing schemas give Zod an input type (`unknown`/
 * `string`) that differs from its output type (`number`), which breaks
 * `zodResolver`'s generics when `useForm<T>` is pinned to a single type.
 * Values are converted to numbers only at submit time, right before they're
 * sent to the typed `CreateSalesOrderInput`/etc.
 */
function numericString(message: string, predicate: (n: number) => boolean) {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => !Number.isNaN(Number(value)) && predicate(Number(value)), { message });
}

/** Mirrors `salesOrderItemSchema` in `apps/api/src/modules/sales/salesOrders.validation.ts`. */
export const salesOrderItemFormSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  quantity: numericString('Enter a whole number greater than 0', (n) => Number.isInteger(n) && n > 0),
  unitPrice: numericString('Enter a non-negative price', (n) => n >= 0),
  discount: numericString('Enter a discount between 0 and 100', (n) => n >= 0 && n <= 100),
});

/** Mirrors `createSalesOrderSchema`. */
export const salesOrderFormSchema = z.object({
  distributorId: z.string().min(1, 'Select a distributor'),
  currency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code (e.g. PKR)')
    .transform((value) => value.toUpperCase()),
  discountPercent: numericString('Enter a discount between 0 and 100', (n) => n >= 0 && n <= 100),
  items: z.array(salesOrderItemFormSchema).min(1, 'Add at least one line item'),
});

export type SalesOrderFormValues = z.infer<typeof salesOrderFormSchema>;

/** Mirrors `confirmSalesOrderSchema`. */
export const confirmOrderFormSchema = z.object({
  warehouseId: z.string().min(1, 'Select a warehouse'),
});

export type ConfirmOrderFormValues = z.infer<typeof confirmOrderFormSchema>;

/** Mirrors `recordPaymentSchema`. `amount` is capped against the invoice's remaining balance at submit time (see `record-payment-dialog.tsx`), not in this static schema. */
export const recordPaymentFormSchema = z.object({
  amount: numericString('Enter an amount greater than 0', (n) => n > 0),
  method: z.enum(PAYMENT_METHODS, { message: 'Select a payment method' }),
  paymentDate: z.string().optional().or(z.literal('')),
  reference: z.string().optional(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;

/** Mirrors `createReturnSchema` — `restock` fields are only required when `restock` is checked (enforced by `superRefine` since the API's own restock object is all-or-nothing). */
export const createReturnFormSchema = z
  .object({
    productId: z.string().min(1, 'Select a product'),
    quantity: numericString('Enter a whole number greater than 0', (n) => Number.isInteger(n) && n > 0),
    reason: z.string().optional(),
    restock: z.boolean(),
    warehouseId: z.string().optional(),
    lotNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.restock) return;
    if (!data.warehouseId) {
      ctx.addIssue({ code: 'custom', message: 'Select a warehouse to restock into', path: ['warehouseId'] });
    }
    if (!data.lotNumber?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Enter a lot number for the restocked quantity', path: ['lotNumber'] });
    }
  });

export type CreateReturnFormValues = z.infer<typeof createReturnFormSchema>;
