'use client';

import Link from 'next/link';
import { BellIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/features/notifications/format';
import { useMarkAllNotificationsRead, useNotifications, useUnreadCount } from '@/features/notifications/hooks';

/**
 * Top-nav notification bell — wired to Phase 8.12's real notification-center
 * hooks (`GET /notifications/unread-count`, `GET /notifications`,
 * `POST /notifications/mark-all-read`; see `src/features/notifications/`).
 * Shows a live unread-count badge and a preview of the 5 most recent unread
 * notifications; "View all" / clicking a preview item links to the full
 * `/notifications` page.
 *
 * Visible/functional for every logged-in user, not just Super Admin/
 * Executive: unlike the sidebar link (gated on `notifications:view`, see
 * `src/lib/nav-config.ts`), the underlying endpoints have no role gate — every
 * user manages their own inbox by ownership (see
 * `apps/api/src/modules/notifications/notifications.routes.ts`'s comment).
 *
 * `DropdownMenuLabel` is wrapped in `DropdownMenuGroup` per this app's Base UI
 * gotcha (see `apps/web/README.md`'s "Next.js 16 gotchas" — a bare
 * `DropdownMenuLabel` throws `"MenuGroupContext is missing"` at runtime,
 * unlike the old Radix-based dropdown). The bell's own trigger button is a
 * real button (opens a menu, doesn't navigate) so it's fine to use `Button`
 * directly there; the menu items that do navigate use `render={<Link .../>}`
 * instead, per the same Base UI `render`-prop convention as `user-menu.tsx`.
 */
export function NotificationBell() {
  const unreadQuery = useUnreadCount();
  const previewQuery = useNotifications({ page: 1, pageSize: 5, isRead: false });
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadQuery.data?.count ?? 0;
  const preview = previewQuery.data?.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <BellIcon />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute top-0.5 right-0.5 h-4 min-w-4 justify-center px-1 text-[10px] leading-none"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  markAllRead.mutate();
                }}
              >
                Mark all read
              </button>
            )}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {preview.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
          ) : (
            preview.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                render={<Link href="/notifications" />}
                className="flex-col items-start gap-0.5"
              >
                <span className="text-sm font-medium">{notification.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</span>
                <span className="text-[11px] text-muted-foreground">{formatDateTime(notification.createdAt)}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/notifications" />} className="justify-center text-sm font-medium">
            View all
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
