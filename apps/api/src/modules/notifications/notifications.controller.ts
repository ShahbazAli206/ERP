import type { Request, Response } from 'express';
import { ApiError } from '../../shared/ApiError';
import { created, ok } from '../../shared/response';
import { notificationsService } from './notifications.service';
import { createNotificationSchema, listNotificationsQuerySchema } from './notifications.validation';

function currentUserId(req: Request): string {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user.sub;
}

export const notificationsController = {
  async list(req: Request, res: Response) {
    const query = listNotificationsQuerySchema.parse(req.query);
    const { items, pagination } = await notificationsService.list(currentUserId(req), query);
    ok(res, items, { pagination });
  },

  async unreadCount(req: Request, res: Response) {
    const result = await notificationsService.unreadCount(currentUserId(req));
    ok(res, result);
  },

  async markAsRead(req: Request<{ id: string }>, res: Response) {
    const notification = await notificationsService.markAsRead(currentUserId(req), req.params.id);
    ok(res, notification);
  },

  async markAllAsRead(req: Request, res: Response) {
    const result = await notificationsService.markAllAsRead(currentUserId(req));
    ok(res, result);
  },

  async create(req: Request, res: Response) {
    const input = createNotificationSchema.parse(req.body);
    const notification = await notificationsService.create(input);
    created(res, notification);
  },
};
