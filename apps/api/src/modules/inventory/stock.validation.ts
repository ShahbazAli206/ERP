import { z } from 'zod';

export const goodsReceiptItemSchema = z.object({
  productId: z.string().min(1),
  purchaseOrderItemId: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  lotNumber: z.string().min(1),
  costPrice: z.number().nonnegative(),
  expiryDate: z.coerce.date().optional(),
});

export const createGoodsReceiptSchema = z.object({
  purchaseOrderId: z.string().min(1).optional(),
  warehouseId: z.string().min(1),
  items: z.array(goodsReceiptItemSchema).min(1),
});

export const stockAdjustmentSchema = z
  .object({
    productId: z.string().min(1),
    warehouseId: z.string().min(1),
    quantityDelta: z.number().int().refine((v) => v !== 0, 'quantityDelta cannot be 0'),
    reason: z.string().min(1),
    lotNumber: z.string().optional(),
    costPrice: z.number().nonnegative().optional(),
    expiryDate: z.coerce.date().optional(),
  })
  .refine((data) => data.quantityDelta > 0 ? data.lotNumber !== undefined && data.costPrice !== undefined : true, {
    message: 'lotNumber and costPrice are required when increasing stock',
    path: ['lotNumber'],
  });

export const expiryAlertQuerySchema = z.object({
  withinDays: z.coerce.number().int().positive().default(30),
});

export type CreateGoodsReceiptInput = z.infer<typeof createGoodsReceiptSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type ExpiryAlertQuery = z.infer<typeof expiryAlertQuerySchema>;
