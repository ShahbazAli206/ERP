import { z } from 'zod';

export const createExchangeRateSchema = z.object({
  currencyCode: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase()),
  rateToBase: z.number().positive(),
});

export const updateExchangeRateSchema = z.object({
  rateToBase: z.number().positive(),
});

export const currencyCodeParamSchema = z.object({
  currencyCode: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase()),
});

export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;
export type UpdateExchangeRateInput = z.infer<typeof updateExchangeRateSchema>;
