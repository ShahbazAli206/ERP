'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { CheckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatChannel, formatDateTime } from '../format';
import { useMarkNotificationAsRead } from '../hooks';
import type { Notification } from '../api';

/** Per-row "Mark as read" action — a component (not an inline cell) so it can own its own mutation/hook. */
function MarkAsReadCell({ notification }: { notification: Notification }) {
  const mutation = useMarkNotificationAsRead();

  if (notification.isRead) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => mutation.mutate(notification.id)} disabled={mutation.isPending}>
      <CheckIcon />
      Mark as read
    </Button>
  );
}

export const notificationColumns: ColumnDef<Notification>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Received',
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <span className={row.original.isRead ? 'text-muted-foreground' : 'font-medium'}>{row.original.title}</span>
    ),
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => <span className="line-clamp-2 max-w-md text-muted-foreground">{row.original.message}</span>,
  },
  {
    accessorKey: 'channel',
    header: 'Channel',
    cell: ({ row }) => <Badge variant="outline">{formatChannel(row.original.channel)}</Badge>,
  },
  {
    accessorKey: 'isRead',
    header: 'Status',
    cell: ({ row }) =>
      row.original.isRead ? (
        <Badge variant="secondary">Read</Badge>
      ) : (
        <Badge>Unread</Badge>
      ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <MarkAsReadCell notification={row.original} />,
  },
];
