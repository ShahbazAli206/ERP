import type { Request, Response } from 'express';
import { created, ok } from '../../shared/response';
import { invoicesService } from './invoices.service';
import { createInvoiceSchema, listInvoicesQuerySchema, recordPaymentSchema } from './invoices.validation';

export const invoicesController = {
  async list(req: Request, res: Response) {
    const query = listInvoicesQuerySchema.parse(req.query);
    const { items, pagination } = await invoicesService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    ok(res, await invoicesService.getDetail(req.params.id));
  },

  async create(req: Request, res: Response) {
    const input = createInvoiceSchema.parse(req.body);
    created(res, await invoicesService.create(input));
  },

  async recordPayment(req: Request<{ id: string }>, res: Response) {
    const input = recordPaymentSchema.parse(req.body);
    created(res, await invoicesService.recordPayment(req.params.id, input));
  },
};
