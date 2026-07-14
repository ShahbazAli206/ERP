/**
 * Email Service — Integration Abstraction (Phase 4).
 *
 * Real implementation would send via SMTP (EMAIL_SMTP_HOST/PORT/USER/PASSWORD, see
 * .env.example) or a transactional email API. Not integrated in this demo — this fake
 * just logs what would have been sent and resolves success immediately, so
 * `notifications.service.ts` can dispatch EMAIL-channel notifications through a real
 * interface instead of doing nothing.
 */

export interface EmailDispatchResult {
  success: boolean;
  provider: 'fake-email';
  messageId: string;
}

export interface EmailService {
  send(to: string, subject: string, body: string): Promise<EmailDispatchResult>;
}

class FakeEmailService implements EmailService {
  async send(to: string, subject: string, body: string): Promise<EmailDispatchResult> {
    const messageId = `fake-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.log(
      `[FAKE EMAIL] to=${to} subject="${subject}" body="${body}" (would be sent via EMAIL_SMTP_* once configured) -> ${messageId}`,
    );
    return { success: true, provider: 'fake-email', messageId };
  }
}

export const emailService: EmailService = new FakeEmailService();
