import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

/**
 * Typed API layer for the Notifications module — mirrors
 * `apps/api/src/modules/notifications/notifications.{dto,validation}.ts`.
 *
 * Unlike every other module, the list/read/mark-read endpoints have NO
 * `<module>:<action>` permission gate beyond being logged in — every user
 * manages their own inbox (ownership-checked server-side in
 * `notifications.service.ts`), regardless of role. Only `POST /notifications`
 * (creating a notification for someone else) requires `notifications:create`,
 * which this module doesn't build a UI for (see the module's other files).
 *
 * Sidebar visibility, however, IS gated on `notifications:view` (see
 * `src/lib/nav-config.ts`) — per `apps/api/src/shared/constants/permissions.ts`
 * only Super Admin and Executive have that permission, so in practice only
 * those two roles ever reach this page via the nav, even though the
 * underlying endpoints would serve any authenticated user's own inbox.
 */

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListParams extends ListQueryParams {
  isRead?: boolean;
  channel?: NotificationChannel;
}

export interface UnreadCount {
  count: number;
}

const BASE_PATH = '/notifications';

export const notificationsApi = {
  list: (params: NotificationListParams) => apiClient.getPaginated<Notification>(BASE_PATH, { ...params }),

  unreadCount: () => apiClient.get<UnreadCount>(`${BASE_PATH}/unread-count`),

  markAsRead: (id: string) => apiClient.patch<Notification>(`${BASE_PATH}/${id}/read`),

  markAllAsRead: () => apiClient.post<{ count: number }>(`${BASE_PATH}/mark-all-read`),
};

// ── System settings (generic key-value store) ──────────────────────────────
//
// `src/features/settings/` doesn't exist yet (the Settings module page is
// still `<ComingSoon />` — Phase 8.14 hasn't been built), so this is a small
// local copy of just the two calls this module needs against
// `GET/PUT /settings/system/:key`, rather than importing from a module that
// isn't there. See `IMPLEMENTATION_PLAN.md`'s note that this generic
// key-value store is the intended mechanism for spec bullets like "Reminder
// Settings" / "Alert Settings" that have no dedicated backend table — this
// module stores them under the `notifications.reminderSettings` /
// `notifications.alertSettings` keys (see `schemas.ts`).
//
// Mirrors `apps/api/src/modules/settings/systemSettings.{dto,routes}.ts`:
// both routes are gated on `settings:view` / `settings:edit` respectively.

export interface SystemSetting {
  key: string;
  value: string;
}

export const systemSettingsApi = {
  get: (key: string) => apiClient.get<SystemSetting>(`/settings/system/${key}`),
  set: (key: string, value: string) => apiClient.put<SystemSetting>(`/settings/system/${key}`, { value }),
};
