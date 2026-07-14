import { z } from 'zod';
import { booleanQueryParam, paginationSchema } from '../../shared/pagination';

export const supplierContactSchema = z.object({
  name: z.string().min(1),
  designation: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  currency: z.string().length(3),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
  contacts: z.array(supplierContactSchema).optional(),
});

export const updateSupplierSchema = createSupplierSchema
  .omit({ contacts: true })
  .partial();

export const listSuppliersQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  country: z.string().optional(),
  isActive: booleanQueryParam,
  sortBy: z.enum(['name', 'createdAt', 'country']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type SupplierContactInput = z.infer<typeof supplierContactSchema>;
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;
