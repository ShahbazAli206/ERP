import type { Request, Response } from 'express';
import { created, ok } from '../../shared/response';
import { journalEntriesService } from './journalEntries.service';
import { createJournalEntrySchema, listJournalEntriesQuerySchema } from './journalEntries.validation';

export const journalEntriesController = {
  async list(req: Request, res: Response) {
    const query = listJournalEntriesQuerySchema.parse(req.query);
    const { items, pagination } = await journalEntriesService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    const entry = await journalEntriesService.getDetail(req.params.id);
    ok(res, entry);
  },

  async create(req: Request, res: Response) {
    const input = createJournalEntrySchema.parse(req.body);
    const entry = await journalEntriesService.create(input);
    created(res, entry);
  },
};
