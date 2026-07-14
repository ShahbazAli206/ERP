import { z } from 'zod';

export const systemSettingKeyParamSchema = z.object({
  key: z.string().min(1),
});

export const updateSystemSettingSchema = z.object({
  value: z.string(),
});

export type UpdateSystemSettingInput = z.infer<typeof updateSystemSettingSchema>;
