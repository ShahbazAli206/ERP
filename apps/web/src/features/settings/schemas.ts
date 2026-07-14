import { z } from 'zod';

/**
 * Zod schemas mirroring `apps/api/src/modules/settings/*.validation.ts`
 * (company/exchange-rate schemas) plus a few client-only shapes for the
 * generic system-settings JSON blobs (tax/email/notifications/backup —
 * there's no backend validation for these since they're just an opaque
 * string `value` in the generic key/value store; see `SYSTEM_SETTING_KEYS`
 * in `./api.ts`).
 *
 * Numeric fields use `z.coerce.number()` since native `<input type="number">`
 * elements hand React Hook Form a string — every schema with a coerced field
 * exports both a `*FormInput` (`z.input`, pre-parse) and `*FormValues`
 * (`z.output`, post-coercion); callers use `useForm<Input, unknown, Values>(...)`.
 * Mirrors `features/finance/schemas.ts` / `features/tax/schemas.ts`.
 */

/** Turns an empty string into `undefined` so `.email().optional()` doesn't reject a cleared field. */
const optionalEmail = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.string().email('Enter a valid email').optional(),
);

// ── Company settings (also covers the "Currency" spec section via baseCurrency) ─

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: optionalEmail,
  baseCurrency: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code, e.g. PKR')
    .transform((value) => value.toUpperCase()),
});
export type CompanySettingsFormInput = z.input<typeof companySettingsSchema>;
export type CompanySettingsFormValues = z.output<typeof companySettingsSchema>;

// ── Exchange rates ───────────────────────────────────────────────────────────

/**
 * One schema backs both create and edit dialogs. `currencyCode` is the
 * resource's identifier (`PUT /settings/exchange-rates/:currencyCode` only
 * ever touches `rateToBase`), so the edit dialog renders it read-only and
 * the submit handler only sends `rateToBase` when editing.
 */
export const exchangeRateFormSchema = z.object({
  currencyCode: z
    .string()
    .trim()
    .length(3, 'Use a 3-letter currency code, e.g. USD')
    .transform((value) => value.toUpperCase()),
  rateToBase: z.coerce.number({ error: 'Enter a rate' }).positive('Must be greater than 0'),
});
export type ExchangeRateFormInput = z.input<typeof exchangeRateFormSchema>;
export type ExchangeRateFormValues = z.output<typeof exchangeRateFormSchema>;

// ── System settings: Tax ──────────────────────────────────────────────────────

/**
 * Stored as JSON under `settings.tax`. Deliberately small — the real tax
 * configuration (rates by type, GST/withholding/sales tax) lives in the Tax &
 * Compliance module's own `TaxRate` table; this is company-wide defaults
 * only (registration number, fiscal year start, a fallback rate for quick
 * quoting), which is what a demo ERP's "Settings > Tax" screen plausibly
 * holds instead of duplicating the Tax module.
 */
export const taxSettingsSchema = z.object({
  registrationNumber: z.string().trim().optional(),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12).default(1),
  defaultTaxRate: z.coerce.number({ error: 'Enter a rate' }).min(0).max(100).default(0),
});
export type TaxSettingsFormInput = z.input<typeof taxSettingsSchema>;
export type TaxSettingsFormValues = z.output<typeof taxSettingsSchema>;

export const FISCAL_MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

// ── System settings: Email (SMTP) ─────────────────────────────────────────────

/** Stored as JSON under `settings.email` — outbound-mail config for a demo (no send-test endpoint exists). */
export const emailSettingsSchema = z.object({
  smtpHost: z.string().trim().optional(),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  fromAddress: optionalEmail,
  fromName: z.string().trim().optional(),
  useTls: z.boolean().default(true),
});
export type EmailSettingsFormInput = z.input<typeof emailSettingsSchema>;
export type EmailSettingsFormValues = z.output<typeof emailSettingsSchema>;

// ── System settings: Notifications ────────────────────────────────────────────

/** Stored as JSON under `settings.notifications` — global toggles (per-user prefs are out of scope). */
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  lowStockAlerts: z.boolean().default(true),
  paymentReminders: z.boolean().default(true),
  dailyDigest: z.boolean().default(false),
});
// Every field has a `.default()`, which makes the pre-parse (input) type optional even though
// none of them go through string coercion — same `z.input`/`z.output` split as the coerced
// schemas above, for the same `useForm<Input, unknown, Values>(...)` reason.
export type NotificationSettingsFormInput = z.input<typeof notificationSettingsSchema>;
export type NotificationSettingsFormValues = z.output<typeof notificationSettingsSchema>;

// ── System settings: Backup ───────────────────────────────────────────────────

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

/**
 * Stored as JSON under `settings.backup`. `lastBackupAt` is display-only
 * (there's no backup job in this demo to actually run) — shown as read-only
 * text below the form rather than an editable field.
 */
export const backupSettingsSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly'], { error: 'Select a frequency' }).default('daily'),
  retentionDays: z.coerce.number().int().min(1).max(365).default(30),
});
export type BackupSettingsFormInput = z.input<typeof backupSettingsSchema>;
export type BackupSettingsFormValues = z.output<typeof backupSettingsSchema>;
