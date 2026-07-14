'use client';

import { useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { BellIcon } from 'lucide-react';
import { DataTable } from '@/components/shared/data-table';
import { StatCard } from '@/components/shared/stat-card';
import { notificationColumns } from './notification-columns';
import { ALL, NotificationFilters } from './notification-filters';
import { useNotifications, useUnreadCount } from '../hooks';
import type { NotificationChannel } from '../api';

/**
 * The real Notification Center: unread count, read/channel filters, "mark all
 * read", and a paginated table with a per-row "mark as read" action. This is
 * the module's main view — the other two sections (Channels, Settings) are
 * intentionally lightweight placeholders/settings, per spec.
 */
export function NotificationCenterView() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [readStatus, setReadStatus] = useState(ALL);
  const [channel, setChannel] = useState(ALL);

  const unreadQuery = useUnreadCount();
  const listQuery = useNotifications({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    isRead: readStatus === ALL ? undefined : readStatus === 'read',
    channel: channel === ALL ? undefined : (channel as NotificationChannel),
  });

  function handleReadStatusChange(value: string) {
    setReadStatus(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function handleChannelChange(value: string) {
    setChannel(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  return (
    <div className="mt-6 space-y-6">
      <StatCard
        title="Unread Notifications"
        value={unreadQuery.data?.count ?? 0}
        icon={BellIcon}
        description="Notifications you haven't marked as read yet"
        isLoading={unreadQuery.isLoading}
        className="max-w-xs"
      />

      <NotificationFilters
        readStatus={readStatus}
        onReadStatusChange={handleReadStatusChange}
        channel={channel}
        onChannelChange={handleChannelChange}
        hasUnread={(unreadQuery.data?.count ?? 0) > 0}
      />

      <DataTable
        columns={notificationColumns}
        data={listQuery.data?.data ?? []}
        rowCount={listQuery.data?.pagination.total ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isLoading={listQuery.isLoading}
        emptyTitle="No notifications"
        emptyDescription="You're all caught up — new notifications will show up here."
        getRowId={(row) => row.id}
      />
    </div>
  );
}
