import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { systemSettingsService } from './systemSettings.service';
import { systemSettingKeyParamSchema, updateSystemSettingSchema } from './systemSettings.validation';

export const systemSettingsController = {
  async get(req: Request<{ key: string }>, res: Response) {
    const { key } = systemSettingKeyParamSchema.parse(req.params);
    const setting = await systemSettingsService.get(key);
    ok(res, setting);
  },

  async update(req: Request<{ key: string }>, res: Response) {
    const { key } = systemSettingKeyParamSchema.parse(req.params);
    const { value } = updateSystemSettingSchema.parse(req.body);
    const setting = await systemSettingsService.set(key, value);
    ok(res, setting);
  },
};
