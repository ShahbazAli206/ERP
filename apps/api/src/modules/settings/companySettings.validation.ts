import { z } from 'zod';

export const updateCompanySettingsSchema = z.object({
  companyName: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  baseCurrency: z.string().length(3).optional(),
  logoUrl: z.string().optional(),
});

export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>;
