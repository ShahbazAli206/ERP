/**
 * Push Notifications — Integration Abstraction (Phase 4 extension).
 *
 * Not one of the 8 named Phase 4 integrations, but the `Notification.channel` enum
 * (see schema.prisma) includes PUSH alongside EMAIL/SMS/WHATSAPP, so a fake dispatcher is
 * needed here too for `notifications.service.ts` to handle all non-IN_APP channels
 * uniformly. Real implementation would call a provider like FCM/APNs. This fake just logs
 * what would have been sent and resolves success immediately.
 */

export interface PushDispatchResult {
  success: boolean;
  provider: 'fake-push';
  messageId: string;
}

export interface PushNotificationService {
  send(to: string, title: string, body: string): Promise<PushDispatchResult>;
}

class FakePushNotificationService implements PushNotificationService {
  async send(to: string, title: string, body: string): Promise<PushDispatchResult> {
    const messageId = `fake-push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(
      `[FAKE PUSH] to=${to} title="${title}" body="${body}" (would be sent via a push provider once configured) -> ${messageId}`,
    );
    return { success: true, provider: 'fake-push', messageId };
  }
}

export const pushNotificationService: PushNotificationService = new FakePushNotificationService();
