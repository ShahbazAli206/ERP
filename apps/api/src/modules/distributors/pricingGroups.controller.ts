import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { pricingGroupsService } from './pricingGroups.service';
import { createPricingGroupSchema, updatePricingGroupSchema } from './pricingGroups.validation';

export const pricingGroupsController = {
  async list(_req: Request, res: Response) {
    ok(res, await pricingGroupsService.list());
  },

  async create(req: Request, res: Response) {
    const input = createPricingGroupSchema.parse(req.body);
    created(res, await pricingGroupsService.create(input));
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updatePricingGroupSchema.parse(req.body);
    ok(res, await pricingGroupsService.update(req.params.id, input));
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await pricingGroupsService.delete(req.params.id);
    noContent(res);
  },
};
