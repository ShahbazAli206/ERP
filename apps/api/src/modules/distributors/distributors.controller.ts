import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { distributorsService } from './distributors.service';
import {
  createDistributorSchema,
  listDistributorsQuerySchema,
  updateDistributorSchema,
} from './distributors.validation';

export const distributorsController = {
  async list(req: Request, res: Response) {
    const query = listDistributorsQuerySchema.parse(req.query);
    const { items, pagination } = await distributorsService.list(query);
    ok(res, items, { pagination });
  },

  async getProfile(req: Request<{ id: string }>, res: Response) {
    ok(res, await distributorsService.getProfile(req.params.id));
  },

  async create(req: Request, res: Response) {
    const input = createDistributorSchema.parse(req.body);
    created(res, await distributorsService.create(input));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateDistributorSchema.parse(req.body);
    ok(res, await distributorsService.update(req.params.id, input));
  },

  async deactivate(req: Request<{ id: string }>, res: Response) {
    await distributorsService.deactivate(req.params.id);
    noContent(res);
  },
};
