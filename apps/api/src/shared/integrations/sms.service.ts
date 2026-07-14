/**
 * SMS Gateway — Integration Abstraction (Phase 4).
 *
 * Real implementation would call an SMS gateway API (SMS_GATEWAY_API_KEY, see
 * .env.example). Not integrated in this demo — this fake just logs what would have been
 * sent and resolves success immediately, so `notifications.service.ts` can dispatch
 * SMS-channel notifications through a real interface instead of doing nothing.
 */

export interface SmsDispatchResult {
  success: boolean;
  provider: 'fake-sms';
  messageId: string;
}

export interface SmsGatewayService {
  send(to: string, message: string): Promise<SmsDispatchResult>;
}

class FakeSmsGatewayService implements SmsGatewayService {
  async send(to: string, message: string): Promise<SmsDispatchResult> {
    const messageId = `fake-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(
      `[FAKE SMS] to=${to} message="${message}" (would be sent via SMS_GATEWAY_API_KEY once configured) -> ${messageId}`,
    );
    return { success: true, provider: 'fake-sms', messageId };
  }
}

export const smsGatewayService: SmsGatewayService = new FakeSmsGatewayService();
