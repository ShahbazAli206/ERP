import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { warehousesService } from './warehouses.service';
import { createWarehouseSchema, updateWarehouseSchema } from './warehouses.validation';

export const warehousesController = {
  async list(_req: Request, res: Response) {
    ok(res, await warehousesService.list());
  },

  async create(req: Request, res: Response) {
    const input = createWarehouseSchema.parse(req.body);
    created(res, await warehousesService.create(input));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateWarehouseSchema.parse(req.body);
    ok(res, await warehousesService.update(req.params.id, input));
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await warehousesService.delete(req.params.id);
    noContent(res);
  },
};
