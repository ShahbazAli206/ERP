import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { settingsRolesService } from './roles.service';

export const settingsRolesController = {
  async list(_req: Request, res: Response) {
    const roles = await settingsRolesService.list();
    ok(res, roles);
  },
};
