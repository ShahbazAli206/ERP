import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { productsService } from './products.service';
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from './products.validation';

export const productsController = {
  async list(req: Request, res: Response) {
    const query = listProductsQuerySchema.parse(req.query);
    const { items, pagination } = await productsService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    ok(res, await productsService.getDetail(req.params.id));
  },

  async create(req: Request, res: Response) {
    const input = createProductSchema.parse(req.body);
    created(res, await productsService.create(input));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateProductSchema.parse(req.body);
    ok(res, await productsService.update(req.params.id, input));
  },

  async deactivate(req: Request<{ id: string }>, res: Response) {
    await productsService.deactivate(req.params.id);
    noContent(res);
  },
};
