import { z } from 'zod';
import { booleanQueryParam, paginationSchema } from '../../shared/pagination';

export const createDistributorSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  creditLimit: z.number().nonnegative().default(0),
  pricingGroupId: z.string().min(1).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateDistributorSchema = createDistributorSchema.partial();

export const listDistributorsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  region: z.string().optional(),
  pricingGroupId: z.string().optional(),
  isActive: booleanQueryParam,
  sortBy: z.enum(['name', 'createdAt', 'region']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateDistributorInput = z.infer<typeof createDistributorSchema>;
export type UpdateDistributorInput = z.infer<typeof updateDistributorSchema>;
export type ListDistributorsQuery = z.infer<typeof listDistributorsQuerySchema>;
