/**
 * WhatsApp Business API — Integration Abstraction (Phase 4).
 *
 * Real implementation would call the WhatsApp Business API (WHATSAPP_API_BASE_URL /
 * WHATSAPP_API_TOKEN, see .env.example). Not integrated in this demo — this fake just
 * logs what would have been sent and resolves success immediately, so
 * `notifications.service.ts` can dispatch WHATSAPP-channel notifications through a real
 * interface instead of doing nothing.
 */

export interface WhatsAppDispatchResult {
  success: boolean;
  provider: 'fake-whatsapp';
  messageId: string;
}

export interface WhatsAppBusinessService {
  send(to: string, message: string): Promise<WhatsAppDispatchResult>;
}

class FakeWhatsAppBusinessService implements WhatsAppBusinessService {
  async send(to: string, message: string): Promise<WhatsAppDispatchResult> {
    const messageId = `fake-whatsapp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(
      `[FAKE WHATSAPP] to=${to} message="${message}" (would be sent via the WhatsApp Business API once configured) -> ${messageId}`,
    );
    return { success: true, provider: 'fake-whatsapp', messageId };
  }
}

export const whatsappBusinessService: WhatsAppBusinessService = new FakeWhatsAppBusinessService();
