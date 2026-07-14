import type { NotificationChannel } from '../../generated/prisma/client';

export interface NotificationDto {
  id: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}
