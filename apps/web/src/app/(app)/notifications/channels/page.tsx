import { NotificationsPageShell } from '@/features/notifications/components/notifications-nav';
import { ChannelsView } from '@/features/notifications/components/channels-view';

export default function NotificationChannelsPage() {
  return (
    <NotificationsPageShell
      title="Notifications"
      description="Your notification center and alert preferences."
    >
      <ChannelsView />
    </NotificationsPageShell>
  );
}
