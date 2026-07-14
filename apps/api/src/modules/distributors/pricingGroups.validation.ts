import { z } from 'zod';

export const createPricingGroupSchema = z.object({
  name: z.string().min(1),
  discountPercent: z.number().min(0).max(100).default(0),
});

export const updatePricingGroupSchema = createPricingGroupSchema.partial();

export type CreatePricingGroupInput = z.infer<typeof createPricingGroupSchema>;
export type UpdatePricingGroupInput = z.infer<typeof updatePricingGroupSchema>;
