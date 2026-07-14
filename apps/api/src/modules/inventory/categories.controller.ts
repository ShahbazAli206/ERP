import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { categoriesService } from './categories.service';
import { createCategorySchema, updateCategorySchema } from './categories.validation';

export const categoriesController = {
  async list(_req: Request, res: Response) {
    ok(res, await categoriesService.list());
  },

  async create(req: Request, res: Response) {
    const input = createCategorySchema.parse(req.body);
    created(res, await categoriesService.create(input));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateCategorySchema.parse(req.body);
    ok(res, await categoriesService.update(req.params.id, input));
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await categoriesService.delete(req.params.id);
    noContent(res);
  },
};
