import type { Request, Response } from 'express';
import { created, ok } from '../../shared/response';
import { returnsService } from './returns.service';
import { createCreditNoteSchema, createReturnSchema } from './returns.validation';

export const returnsController = {
  async list(_req: Request, res: Response) {
    ok(res, await returnsService.list());
  },

  async create(req: Request, res: Response) {
    const input = createReturnSchema.parse(req.body);
    created(res, await returnsService.createReturn(input));
  },

  async listCreditNotes(_req: Request, res: Response) {
    ok(res, await returnsService.listCreditNotes());
  },

  async createCreditNote(req: Request, res: Response) {
    const input = createCreditNoteSchema.parse(req.body);
    created(res, await returnsService.createCreditNote(input));
  },
};
