import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { taxService } from './tax.service';
import {
  createTaxSchema,
  listAuditLogsQuerySchema,
  listTaxesQuerySchema,
  updateTaxSchema,
} from './tax.validation';

export const taxController = {
  async list(req: Request, res: Response) {
    const query = listTaxesQuerySchema.parse(req.query);
    const { items, pagination } = await taxService.list(query);
    ok(res, items, { pagination });
  },

  async create(req: Request, res: Response) {
    const input = createTaxSchema.parse(req.body);
    const tax = await taxService.create(input);
    created(res, tax);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateTaxSchema.parse(req.body);
    const tax = await taxService.update(req.params.id, input);
    ok(res, tax);
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await taxService.delete(req.params.id);
    noContent(res);
  },

  async complianceDashboard(_req: Request, res: Response) {
    const dashboard = await taxService.complianceDashboard();
    ok(res, dashboard);
  },

  eInvoice(_req: Request, res: Response) {
    ok(res, taxService.eInvoiceStatus());
  },

  async auditLogs(req: Request, res: Response) {
    const query = listAuditLogsQuerySchema.parse(req.query);
    const { items, pagination } = await taxService.listAuditLogs(query);
    ok(res, items, { pagination });
  },
};
