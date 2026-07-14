import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { companySettingsService } from './companySettings.service';
import { updateCompanySettingsSchema } from './companySettings.validation';

export const companySettingsController = {
  async get(_req: Request, res: Response) {
    const settings = await companySettingsService.get();
    ok(res, settings);
  },

  async update(req: Request, res: Response) {
    const input = updateCompanySettingsSchema.parse(req.body);
    const settings = await companySettingsService.update(input);
    ok(res, settings);
  },
};
