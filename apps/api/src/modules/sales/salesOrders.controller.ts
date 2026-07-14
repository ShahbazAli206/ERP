import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { salesOrdersService } from './salesOrders.service';
import {
  confirmSalesOrderSchema,
  createSalesOrderSchema,
  listSalesOrdersQuerySchema,
  updateSalesOrderSchema,
} from './salesOrders.validation';

export const salesOrdersController = {
  async list(req: Request, res: Response) {
    const query = listSalesOrdersQuerySchema.parse(req.query);
    const { items, pagination } = await salesOrdersService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    ok(res, await salesOrdersService.getDetail(req.params.id));
  },

  async create(req: Request, res: Response) {
    const input = createSalesOrderSchema.parse(req.body);
    created(res, await salesOrdersService.create(input, req.user!.sub));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateSalesOrderSchema.parse(req.body);
    ok(res, await salesOrdersService.update(req.params.id, input));
  },

  async confirm(req: Request<{ id: string }>, res: Response) {
    const { warehouseId } = confirmSalesOrderSchema.parse(req.body);
    ok(res, await salesOrdersService.confirm(req.params.id, req.user!.sub, warehouseId));
  },

  async advance(req: Request<{ id: string }>, res: Response) {
    ok(res, await salesOrdersService.advance(req.params.id, req.user!.sub));
  },

  async cancel(req: Request<{ id: string }>, res: Response) {
    ok(res, await salesOrdersService.cancel(req.params.id, req.user!.sub));
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await salesOrdersService.deleteDraft(req.params.id);
    noContent(res);
  },
};
