import { z } from 'zod';
import { InvoiceStatus, PaymentMethod } from '../../generated/prisma/enums';
import { paginationSchema } from '../../shared/pagination';

export const createInvoiceSchema = z.object({
  salesOrderId: z.string().min(1),
  dueInDays: z.number().int().positive().default(30),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  paymentDate: z.coerce.date().optional(),
  reference: z.string().optional(),
  bankAccountId: z.string().optional(),
});

export const listInvoicesQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(InvoiceStatus).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['issueDate', 'dueDate', 'invoiceNumber']).default('issueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
