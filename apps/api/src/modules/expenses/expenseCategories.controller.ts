import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { expenseCategoriesService } from './expenseCategories.service';
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
} from './expenseCategories.validation';

export const expenseCategoriesController = {
  async list(_req: Request, res: Response) {
    ok(res, await expenseCategoriesService.list());
  },

  async create(req: Request, res: Response) {
    const input = createExpenseCategorySchema.parse(req.body);
    created(res, await expenseCategoriesService.create(input));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateExpenseCategorySchema.parse(req.body);
    ok(res, await expenseCategoriesService.update(req.params.id, input));
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await expenseCategoriesService.delete(req.params.id);
    noContent(res);
  },
};
