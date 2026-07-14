'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { notificationsApi, systemSettingsApi, type NotificationListParams } from './api';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

// ── Notifications ────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications', 'list'] as const,
  list: (params: NotificationListParams) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications(params: NotificationListParams) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
  });
}

/**
 * Polls every 30s so the top-nav bell's badge (and this page's stat card)
 * stay reasonably fresh without a websocket/SSE push infra in this demo.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not mark the notification as read.')),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      toast.success('All notifications marked as read.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not mark all notifications as read.')),
  });
}

// ── System settings (reminder / alert settings) ──────────────────────────────

export function systemSettingQueryKey(key: string) {
  return ['settings', 'system', key] as const;
}

/**
 * `GET /settings/system/:key` 404s until a key has ever been saved (see
 * `systemSettingsService.get` in the API) — that's an expected "not set yet"
 * state here, not a query error, so it's caught and normalized to `null`
 * rather than surfacing `query.isError` for what is really just "use
 * defaults".
 */
export function useSystemSetting(key: string, enabled = true) {
  return useQuery({
    queryKey: systemSettingQueryKey(key),
    queryFn: async () => {
      try {
        return await systemSettingsApi.get(key);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled,
  });
}

export function useSetSystemSetting(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: string) => systemSettingsApi.set(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemSettingQueryKey(key) });
      toast.success('Settings saved.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not save settings.')),
  });
}
