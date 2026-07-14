import type { Request, Response } from 'express';
import { paginationSchema } from '../../shared/pagination';
import { ok } from '../../shared/response';
import { settingsUsersService } from './users.service';

export const settingsUsersController = {
  async list(req: Request, res: Response) {
    const query = paginationSchema.parse(req.query);
    const { items, pagination } = await settingsUsersService.list(query);
    ok(res, items, { pagination });
  },
};
