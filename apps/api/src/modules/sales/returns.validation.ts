import { z } from 'zod';

export const createReturnSchema = z.object({
  salesOrderId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
  restock: z
    .object({
      warehouseId: z.string().min(1),
      lotNumber: z.string().min(1),
    })
    .optional(),
});

export const createCreditNoteSchema = z
  .object({
    salesReturnId: z.string().min(1).optional(),
    invoiceId: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    reason: z.string().optional(),
  })
  .refine((data) => Boolean(data.salesReturnId || data.invoiceId), {
    message: 'Either salesReturnId or invoiceId is required',
    path: ['salesReturnId'],
  });

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type CreateCreditNoteInput = z.infer<typeof createCreditNoteSchema>;
