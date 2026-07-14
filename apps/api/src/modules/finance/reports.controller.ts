import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { reportsService } from './reports.service';
import { dateRangeQuerySchema } from './reports.validation';

export const reportsController = {
  async receivables(_req: Request, res: Response) {
    const items = await reportsService.receivables();
    ok(res, items);
  },

  async payables(_req: Request, res: Response) {
    const items = await reportsService.payables();
    ok(res, items);
  },

  async cashPosition(_req: Request, res: Response) {
    const result = await reportsService.cashPosition();
    ok(res, result);
  },

  async profitLoss(req: Request, res: Response) {
    const range = dateRangeQuerySchema.parse(req.query);
    const result = await reportsService.profitLoss(range);
    ok(res, result);
  },

  async balanceSheet(_req: Request, res: Response) {
    const result = await reportsService.balanceSheet();
    ok(res, result);
  },

  async cashFlow(req: Request, res: Response) {
    const range = dateRangeQuerySchema.parse(req.query);
    const result = await reportsService.cashFlow(range);
    ok(res, result);
  },
};
