import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { emailService } from '../../shared/integrations/email.service';
import { smsGatewayService } from '../../shared/integrations/sms.service';
import { whatsappBusinessService } from '../../shared/integrations/whatsapp.service';
import { pushNotificationService } from '../../shared/integrations/push.service';
import { notificationsRepository } from './notifications.repository';
import type { NotificationDto } from './notifications.dto';
import type { CreateNotificationInput, ListNotificationsQuery } from './notifications.validation';

function toDto(notification: {
  id: string;
  userId: string;
  channel: NotificationDto['channel'];
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}): NotificationDto {
  return {
    id: notification.id,
    userId: notification.userId,
    channel: notification.channel,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

// Simulates the "would have been sent externally" side effect for non-IN_APP channels via
// the fake Phase 4 integration abstractions. Never throws — a dispatch failure (real or
// fake) must not prevent the in-app notification row (the notification-center source of
// truth) from being created.
async function dispatchExternalChannel(input: CreateNotificationInput): Promise<void> {
  try {
    switch (input.channel) {
      case 'EMAIL':
        await emailService.send(input.userId, input.title, input.message);
        break;
      case 'SMS':
        await smsGatewayService.send(input.userId, input.message);
        break;
      case 'WHATSAPP':
        await whatsappBusinessService.send(input.userId, input.message);
        break;
      case 'PUSH':
        await pushNotificationService.send(input.userId, input.title, input.message);
        break;
      case 'IN_APP':
        break;
    }
  } catch (err) {
    console.error('[notifications] external channel dispatch failed', err);
  }
}

export const notificationsService = {
  async list(
    userId: string,
    query: ListNotificationsQuery,
  ): Promise<{ items: NotificationDto[]; pagination: Pagination }> {
    const { total, notifications } = await notificationsRepository.list(userId, query);
    return {
      items: notifications.map(toDto),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await notificationsRepository.unreadCount(userId);
    return { count };
  },

  async markAsRead(userId: string, id: string): Promise<NotificationDto> {
    const existing = await notificationsRepository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound('Notification not found');
    }
    const updated = await notificationsRepository.markAsRead(id);
    return toDto(updated);
  },

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await notificationsRepository.markAllAsRead(userId);
    return { count: result.count };
  },

  async create(input: CreateNotificationInput): Promise<NotificationDto> {
    const notification = await notificationsRepository.create(input);
    if (input.channel !== 'IN_APP') {
      await dispatchExternalChannel(input);
    }
    return toDto(notification);
  },
};
