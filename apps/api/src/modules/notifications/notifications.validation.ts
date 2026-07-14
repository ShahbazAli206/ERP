import { z } from 'zod';
import { booleanQueryParam, paginationSchema } from '../../shared/pagination';

export const notificationChannelEnum = z.enum(['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH']);

export const listNotificationsQuerySchema = paginationSchema.extend({
  isRead: booleanQueryParam,
  channel: notificationChannelEnum.optional(),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  channel: notificationChannelEnum.default('IN_APP'),
  title: z.string().min(1),
  message: z.string().min(1),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
