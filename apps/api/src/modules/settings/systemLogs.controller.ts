import type { Request, Response } from 'express';
import { paginationSchema } from '../../shared/pagination';
import { ok } from '../../shared/response';
import { systemLogsService } from './systemLogs.service';

export const systemLogsController = {
  async list(req: Request, res: Response) {
    const query = paginationSchema.parse(req.query);
    const { items, pagination } = await systemLogsService.list(query);
    ok(res, items, { pagination });
  },
};
