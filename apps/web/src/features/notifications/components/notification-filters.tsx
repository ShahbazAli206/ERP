'use client';

import { CheckCheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarkAllNotificationsRead } from '../hooks';

export const ALL = '__all__';

const READ_STATUS_ITEMS = [
  { value: ALL, label: 'All' },
  { value: 'unread', label: 'Unread only' },
  { value: 'read', label: 'Read only' },
];

const CHANNEL_ITEMS = [
  { value: ALL, label: 'All channels' },
  { value: 'IN_APP', label: 'In-App' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PUSH', label: 'Push' },
];

export function NotificationFilters({
  readStatus,
  onReadStatusChange,
  channel,
  onChannelChange,
  hasUnread,
}: {
  readStatus: string;
  onReadStatusChange: (value: string) => void;
  channel: string;
  onChannelChange: (value: string) => void;
  hasUnread: boolean;
}) {
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notification-status-filter" className="text-xs text-muted-foreground">
            Status
          </Label>
          {/* `items` is required, not cosmetic — see README's Select gotcha: without it the
              closed trigger falls back to the raw stored value once the popup unmounts. */}
          <Select items={READ_STATUS_ITEMS} value={readStatus} onValueChange={(value) => onReadStatusChange(value ?? ALL)}>
            <SelectTrigger id="notification-status-filter" className="w-[160px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {READ_STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notification-channel-filter" className="text-xs text-muted-foreground">
            Channel
          </Label>
          <Select items={CHANNEL_ITEMS} value={channel} onValueChange={(value) => onChannelChange(value ?? ALL)}>
            <SelectTrigger id="notification-channel-filter" className="w-[160px]">
              <SelectValue placeholder="All channels" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => markAllRead.mutate()}
        disabled={!hasUnread || markAllRead.isPending}
      >
        <CheckCheckIcon />
        Mark all read
      </Button>
    </div>
  );
}
