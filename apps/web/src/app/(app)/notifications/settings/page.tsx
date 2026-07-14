import { NotificationsPageShell } from '@/features/notifications/components/notifications-nav';
import { NotificationSettingsView } from '@/features/notifications/components/notification-settings-view';

export default function NotificationSettingsPage() {
  return (
    <NotificationsPageShell
      title="Notifications"
      description="Your notification center and alert preferences."
    >
      <NotificationSettingsView />
    </NotificationsPageShell>
  );
}
