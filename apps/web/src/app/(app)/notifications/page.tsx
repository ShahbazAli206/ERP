import { NotificationsPageShell } from '@/features/notifications/components/notifications-nav';
import { NotificationCenterView } from '@/features/notifications/components/notification-center-view';

export default function NotificationsPage() {
  return (
    <NotificationsPageShell
      title="Notifications"
      description="Your notification center and alert preferences."
    >
      <NotificationCenterView />
    </NotificationsPageShell>
  );
}
