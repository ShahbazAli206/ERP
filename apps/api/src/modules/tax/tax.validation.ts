import { z } from 'zod';
import { booleanQueryParam, paginationSchema } from '../../shared/pagination';

export const taxTypeEnum = z.enum(['GST', 'SALES_TAX', 'WITHHOLDING_TAX']);

export const createTaxSchema = z.object({
  name: z.string().min(1),
  type: taxTypeEnum,
  rate: z.number().min(0),
  appliesTo: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateTaxSchema = createTaxSchema.partial();

export const listTaxesQuerySchema = paginationSchema.extend({
  type: taxTypeEnum.optional(),
  isActive: booleanQueryParam,
});

export const listAuditLogsQuerySchema = paginationSchema.extend({});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type ListTaxesQuery = z.infer<typeof listTaxesQuerySchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
