import { z } from 'zod';

/**
 * "Reminder Settings" / "Alert Settings" (spec: `project_description.txt`
 * Module 12) have no dedicated backend table — per `IMPLEMENTATION_PLAN.md`,
 * the generic key-value `system_settings` store (`GET/PUT
 * /settings/system/:key`) covers spec bullets like these without needing new
 * Prisma models. Each object round-trips as one JSON-encoded string `value`
 * under the keys below (see `../components/notification-settings-view.tsx`
 * for the read/write UI, gated on `settings:view`/`settings:edit`).
 */

export const REMINDER_SETTINGS_KEY = 'notifications.reminderSettings';
export const ALERT_SETTINGS_KEY = 'notifications.alertSettings';

export const reminderSettingsSchema = z.object({
  lowStockReminders: z.boolean(),
  paymentDueReminders: z.boolean(),
  shipmentEtaReminders: z.boolean(),
});
export type ReminderSettingsValues = z.infer<typeof reminderSettingsSchema>;

export const DEFAULT_REMINDER_SETTINGS: ReminderSettingsValues = {
  lowStockReminders: true,
  paymentDueReminders: true,
  shipmentEtaReminders: true,
};

/**
 * These toggles describe intent only — this demo's dispatch already always
 * fires for whichever `channel` a notification is created with (see
 * `apps/api/src/modules/notifications/notifications.service.ts`'s
 * `dispatchExternalChannel`), and creation isn't exposed to non-Super-Admin
 * users. There's no backend enforcement tying these flags to that dispatch;
 * they're a settings-store placeholder per the spec, not a real feature
 * switch.
 */
export const alertSettingsSchema = z.object({
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  whatsappAlerts: z.boolean(),
  pushAlerts: z.boolean(),
});
export type AlertSettingsValues = z.infer<typeof alertSettingsSchema>;

export const DEFAULT_ALERT_SETTINGS: AlertSettingsValues = {
  emailAlerts: false,
  smsAlerts: false,
  whatsappAlerts: false,
  pushAlerts: false,
};
