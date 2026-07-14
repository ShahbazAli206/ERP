import { z } from 'zod';
import { PurchaseOrderStatus } from '../../generated/prisma/enums';
import { paginationSchema } from '../../shared/pagination';

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  currency: z.string().length(3),
  exchangeRateToBase: z.number().positive().default(1),
  expectedArrival: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1),
});

export const updatePurchaseOrderSchema = z.object({
  currency: z.string().length(3).optional(),
  exchangeRateToBase: z.number().positive().optional(),
  expectedArrival: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1).optional(),
});

export const rejectPurchaseOrderSchema = z.object({
  reason: z.string().min(1),
});

export const listPurchaseOrdersQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  supplierId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['orderDate', 'createdAt', 'poNumber']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export type RejectPurchaseOrderInput = z.infer<typeof rejectPurchaseOrderSchema>;
export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuerySchema>;
