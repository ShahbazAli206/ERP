import { z } from 'zod';
import { SalesOrderStatus } from '../../generated/prisma/enums';
import { paginationSchema } from '../../shared/pagination';

export const salesOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100).default(0),
});

export const createSalesOrderSchema = z.object({
  distributorId: z.string().min(1),
  currency: z.string().length(3).default('PKR'),
  discountPercent: z.number().min(0).max(100).default(0),
  items: z.array(salesOrderItemSchema).min(1),
});

export const updateSalesOrderSchema = z.object({
  discountPercent: z.number().min(0).max(100).optional(),
  items: z.array(salesOrderItemSchema).min(1).optional(),
});

export const confirmSalesOrderSchema = z.object({
  warehouseId: z.string().min(1),
});

export const listSalesOrdersQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(SalesOrderStatus).optional(),
  distributorId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['orderDate', 'createdAt', 'orderNumber']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
export type ConfirmSalesOrderInput = z.infer<typeof confirmSalesOrderSchema>;
export type ListSalesOrdersQuery = z.infer<typeof listSalesOrdersQuerySchema>;
