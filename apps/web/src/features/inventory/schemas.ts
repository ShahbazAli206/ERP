import { z } from 'zod';

/**
 * Zod schemas mirroring `apps/api/src/modules/inventory/*.validation.ts`.
 *
 * Numeric fields use `z.coerce.number()` since native `<input type="number">`
 * elements hand React Hook Form a string. Coercing schemas give Zod an input
 * type (`unknown`/`string`) that differs from its output type (`number`),
 * which breaks `zodResolver`'s generics if `useForm` is pinned to a single
 * type — so every schema with a coerced field exports both a `*FormInput`
 * (`z.input`, pre-parse — what `defaultValues` and field `name`s are typed
 * against) and a `*FormValues` (`z.output`, post-coercion — what the submit
 * handler receives), and callers use `useForm<Input, unknown, Output>(...)`.
 * Mirrors `features/shipments/schemas.ts`, the first module in this repo to
 * hit the same issue.
 */

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.string().optional(),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
});
export type WarehouseFormValues = z.infer<typeof warehouseSchema>;

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  costPrice: z.coerce.number({ error: 'Cost price is required' }).nonnegative('Must be 0 or more'),
  sellingPrice: z.coerce.number({ error: 'Selling price is required' }).nonnegative('Must be 0 or more'),
  reorderLevel: z.coerce.number({ error: 'Reorder level is required' }).int('Must be a whole number').nonnegative('Must be 0 or more'),
});
export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;

export const goodsReceiptItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  purchaseOrderItemId: z.string().optional(),
  quantity: z.coerce.number({ error: 'Quantity is required' }).int('Must be a whole number').positive('Must be greater than 0'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  costPrice: z.coerce.number({ error: 'Cost price is required' }).nonnegative('Must be 0 or more'),
  expiryDate: z.string().optional(),
});
export type GoodsReceiptItemFormInput = z.input<typeof goodsReceiptItemSchema>;
export type GoodsReceiptItemFormValues = z.output<typeof goodsReceiptItemSchema>;

export const goodsReceiptSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  purchaseOrderId: z.string().optional(),
  items: z.array(goodsReceiptItemSchema).min(1, 'Add at least one item'),
});
export type GoodsReceiptFormInput = z.input<typeof goodsReceiptSchema>;
export type GoodsReceiptFormValues = z.output<typeof goodsReceiptSchema>;

export const stockAdjustmentSchema = z
  .object({
    productId: z.string().min(1, 'Product is required'),
    warehouseId: z.string().min(1, 'Warehouse is required'),
    direction: z.enum(['increase', 'decrease']),
    quantity: z.coerce.number({ error: 'Quantity is required' }).int('Must be a whole number').positive('Must be greater than 0'),
    reason: z.string().min(1, 'Reason is required'),
    lotNumber: z.string().optional(),
    costPrice: z.coerce.number().nonnegative('Must be 0 or more').optional(),
    expiryDate: z.string().optional(),
  })
  .refine((data) => (data.direction === 'increase' ? Boolean(data.lotNumber) : true), {
    message: 'Lot number is required when increasing stock',
    path: ['lotNumber'],
  })
  .refine((data) => (data.direction === 'increase' ? data.costPrice !== undefined : true), {
    message: 'Cost price is required when increasing stock',
    path: ['costPrice'],
  });
export type StockAdjustmentFormInput = z.input<typeof stockAdjustmentSchema>;
export type StockAdjustmentFormValues = z.output<typeof stockAdjustmentSchema>;
