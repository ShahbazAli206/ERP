import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { bankAccountsService } from './bankAccounts.service';
import {
  createBankAccountSchema,
  listBankAccountsQuerySchema,
  updateBankAccountSchema,
} from './bankAccounts.validation';

export const bankAccountsController = {
  async list(req: Request, res: Response) {
    const query = listBankAccountsQuerySchema.parse(req.query);
    const { items, pagination } = await bankAccountsService.list(query);
    ok(res, items, { pagination });
  },

  async getById(req: Request<{ id: string }>, res: Response) {
    const bankAccount = await bankAccountsService.getById(req.params.id);
    ok(res, bankAccount);
  },

  async create(req: Request, res: Response) {
    const input = createBankAccountSchema.parse(req.body);
    const bankAccount = await bankAccountsService.create(input);
    created(res, bankAccount);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateBankAccountSchema.parse(req.body);
    const bankAccount = await bankAccountsService.update(req.params.id, input);
    ok(res, bankAccount);
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await bankAccountsService.remove(req.params.id);
    noContent(res);
  },
};
