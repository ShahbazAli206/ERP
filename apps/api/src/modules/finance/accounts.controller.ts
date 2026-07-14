import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { accountsService } from './accounts.service';
import {
  createAccountSchema,
  listAccountsQuerySchema,
  updateAccountSchema,
} from './accounts.validation';

export const accountsController = {
  async list(req: Request, res: Response) {
    const query = listAccountsQuerySchema.parse(req.query);
    const { items, pagination } = await accountsService.list(query);
    ok(res, items, { pagination });
  },

  async getById(req: Request<{ id: string }>, res: Response) {
    const account = await accountsService.getById(req.params.id);
    ok(res, account);
  },

  async create(req: Request, res: Response) {
    const input = createAccountSchema.parse(req.body);
    const account = await accountsService.create(input);
    created(res, account);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateAccountSchema.parse(req.body);
    const account = await accountsService.update(req.params.id, input);
    ok(res, account);
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await accountsService.remove(req.params.id);
    noContent(res);
  },
};
