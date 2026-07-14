/**
 * Formatting helpers local to the Notifications module (kept out of `src/lib`
 * per this module's folder boundary — see `src/features/tax/format.ts` for
 * the same per-module convention).
 */

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const CHANNEL_LABEL: Record<string, string> = {
  IN_APP: 'In-App',
  EMAIL: 'Email',
  SMS: 'SMS',
  WHATSAPP: 'WhatsApp',
  PUSH: 'Push',
};

export function formatChannel(channel: string): string {
  return CHANNEL_LABEL[channel] ?? channel;
}
