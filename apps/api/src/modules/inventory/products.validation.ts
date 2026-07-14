import { z } from 'zod';
import { booleanQueryParam, paginationSchema } from '../../shared/pagination';

export const createProductSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1).optional(),
  unit: z.string().default('pcs'),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  reorderLevel: z.number().int().nonnegative().default(0),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const listProductsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: booleanQueryParam,
  sortBy: z.enum(['name', 'sku', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
