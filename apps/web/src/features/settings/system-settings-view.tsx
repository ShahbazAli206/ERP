'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { TriangleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckboxFormField, SelectFormField, TextFormField } from '@/components/shared/form-fields';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-client';
import { SYSTEM_SETTING_KEYS } from './api';
import { useSetSystemSetting, useSystemSetting } from './hooks';
import { SettingsPageShell } from './settings-nav';
import {
  BACKUP_FREQUENCY_OPTIONS,
  FISCAL_MONTH_OPTIONS,
  backupSettingsSchema,
  emailSettingsSchema,
  notificationSettingsSchema,
  taxSettingsSchema,
  type BackupSettingsFormInput,
  type BackupSettingsFormValues,
  type EmailSettingsFormInput,
  type EmailSettingsFormValues,
  type NotificationSettingsFormInput,
  type NotificationSettingsFormValues,
  type TaxSettingsFormInput,
  type TaxSettingsFormValues,
} from './schemas';

/**
 * There's no dedicated Tax/Email/Notification/Backup table in the API —
 * these are all thin forms over the generic `GET/PUT /settings/system/:key`
 * key/value store (see `SYSTEM_SETTING_KEYS` in `./api.ts`). Each tab
 * JSON-encodes a small object into that key's string `value`.
 *
 * A fresh key 404s until saved once (expected for a seeded demo, not a real
 * error — see `useSystemSetting`'s docstring) — every form below treats a
 * 404 as "use these defaults" and only surfaces a real error banner for
 * anything else (network failure, 403, etc).
 */

function parseJsonSafe<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return { ...fallback, ...JSON.parse(value) } as T;
  } catch {
    return fallback;
  }
}

/** True once the query has settled into either "no value yet" (404) or a real, non-404 failure. */
function isRealError(error: unknown): boolean {
  return error instanceof ApiError && error.status !== 404;
}

// ── Tax settings ──────────────────────────────────────────────────────────────

// `fiscalYearStartMonth` is kept as a string in form state (matching `FISCAL_MONTH_OPTIONS`' string
// values, since `<Select>` compares by value equality) even though the schema coerces it to a
// number on submit — same input/output split reasoning as the coerced numeric text fields.
const TAX_DEFAULTS: TaxSettingsFormInput = { registrationNumber: '', fiscalYearStartMonth: '1', defaultTaxRate: 0 };

function TaxSettingsForm() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings:edit');
  const query = useSystemSetting(SYSTEM_SETTING_KEYS.tax);
  const mutation = useSetSystemSetting(SYSTEM_SETTING_KEYS.tax);

  const form = useForm<TaxSettingsFormInput, unknown, TaxSettingsFormValues>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: TAX_DEFAULTS,
  });

  useEffect(() => {
    if (query.isLoading) return;
    const parsed = parseJsonSafe(query.data?.value, TAX_DEFAULTS);
    // The saved JSON stores `fiscalYearStartMonth` as the coerced number (post-submit) — restring
    // it so it matches `FISCAL_MONTH_OPTIONS`' string values on the next render.
    form.reset({ ...parsed, fiscalYearStartMonth: String(parsed.fiscalYearStartMonth) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the fetched record settles
  }, [query.isLoading, query.data]);

  const onSubmit = (values: TaxSettingsFormValues) => {
    mutation.mutate(JSON.stringify(values), { onSuccess: () => toast.success('Tax settings updated') });
  };

  if (query.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const errorMessage = isRealError(query.error)
    ? (query.error as ApiError).message
    : mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <TextFormField
          control={form.control}
          name="registrationNumber"
          label="Tax registration number"
          placeholder="NTN-1234567-8"
          disabled={!canEdit || mutation.isPending}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectFormField
            control={form.control}
            name="fiscalYearStartMonth"
            label="Fiscal year starts"
            options={FISCAL_MONTH_OPTIONS}
            disabled={!canEdit || mutation.isPending}
          />
          <TextFormField
            control={form.control}
            name="defaultTaxRate"
            label="Default tax rate (%)"
            type="number"
            description="Fallback rate for quick quoting — actual tax rates live in Tax & Compliance."
            disabled={!canEdit || mutation.isPending}
          />
        </div>
      </FieldGroup>
      {errorMessage && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t save tax settings</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Email (SMTP) settings ─────────────────────────────────────────────────────

const EMAIL_DEFAULTS: EmailSettingsFormInput = { smtpHost: '', smtpPort: 587, fromAddress: '', fromName: '', useTls: true };

function EmailSettingsForm() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings:edit');
  const query = useSystemSetting(SYSTEM_SETTING_KEYS.email);
  const mutation = useSetSystemSetting(SYSTEM_SETTING_KEYS.email);

  const form = useForm<EmailSettingsFormInput, unknown, EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: EMAIL_DEFAULTS,
  });

  useEffect(() => {
    if (query.isLoading) return;
    form.reset(parseJsonSafe(query.data?.value, EMAIL_DEFAULTS));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the fetched record settles
  }, [query.isLoading, query.data]);

  const onSubmit = (values: EmailSettingsFormValues) => {
    mutation.mutate(JSON.stringify(values), { onSuccess: () => toast.success('Email settings updated') });
  };

  if (query.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const errorMessage = isRealError(query.error)
    ? (query.error as ApiError).message
    : mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextFormField control={form.control} name="smtpHost" label="SMTP host" placeholder="smtp.example.com" disabled={!canEdit || mutation.isPending} />
          <TextFormField control={form.control} name="smtpPort" label="SMTP port" type="number" disabled={!canEdit || mutation.isPending} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextFormField
            control={form.control}
            name="fromAddress"
            label="From address"
            type="email"
            placeholder="no-reply@example.com"
            disabled={!canEdit || mutation.isPending}
          />
          <TextFormField control={form.control} name="fromName" label="From name" placeholder="ERP Notifications" disabled={!canEdit || mutation.isPending} />
        </div>
        <CheckboxFormField
          control={form.control}
          name="useTls"
          label="Use TLS"
          description="Encrypt the connection to the SMTP server."
          disabled={!canEdit || mutation.isPending}
        />
      </FieldGroup>
      {errorMessage && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t save email settings</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Notification settings ─────────────────────────────────────────────────────

const NOTIFICATION_DEFAULTS: NotificationSettingsFormInput = {
  emailNotifications: true,
  lowStockAlerts: true,
  paymentReminders: true,
  dailyDigest: false,
};

function NotificationSettingsForm() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings:edit');
  const query = useSystemSetting(SYSTEM_SETTING_KEYS.notifications);
  const mutation = useSetSystemSetting(SYSTEM_SETTING_KEYS.notifications);

  const form = useForm<NotificationSettingsFormInput, unknown, NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: NOTIFICATION_DEFAULTS,
  });

  useEffect(() => {
    if (query.isLoading) return;
    form.reset(parseJsonSafe(query.data?.value, NOTIFICATION_DEFAULTS));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the fetched record settles
  }, [query.isLoading, query.data]);

  const onSubmit = (values: NotificationSettingsFormValues) => {
    mutation.mutate(JSON.stringify(values), { onSuccess: () => toast.success('Notification settings updated') });
  };

  if (query.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const errorMessage = isRealError(query.error)
    ? (query.error as ApiError).message
    : mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <CheckboxFormField
          control={form.control}
          name="emailNotifications"
          label="Email notifications"
          description="Send notification emails in addition to in-app alerts."
          disabled={!canEdit || mutation.isPending}
        />
        <CheckboxFormField
          control={form.control}
          name="lowStockAlerts"
          label="Low-stock alerts"
          description="Notify when a product falls below its reorder level."
          disabled={!canEdit || mutation.isPending}
        />
        <CheckboxFormField
          control={form.control}
          name="paymentReminders"
          label="Payment reminders"
          description="Notify about overdue receivables and payables."
          disabled={!canEdit || mutation.isPending}
        />
        <CheckboxFormField
          control={form.control}
          name="dailyDigest"
          label="Daily digest"
          description="Send a daily summary email instead of individual alerts."
          disabled={!canEdit || mutation.isPending}
        />
      </FieldGroup>
      {errorMessage && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t save notification settings</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Backup settings ────────────────────────────────────────────────────────────

const BACKUP_DEFAULTS: BackupSettingsFormInput = { frequency: 'daily', retentionDays: 30 };

function BackupSettingsForm() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings:edit');
  const query = useSystemSetting(SYSTEM_SETTING_KEYS.backup);
  const mutation = useSetSystemSetting(SYSTEM_SETTING_KEYS.backup);

  const form = useForm<BackupSettingsFormInput, unknown, BackupSettingsFormValues>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues: BACKUP_DEFAULTS,
  });

  useEffect(() => {
    if (query.isLoading) return;
    form.reset(parseJsonSafe(query.data?.value, BACKUP_DEFAULTS));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the fetched record settles
  }, [query.isLoading, query.data]);

  const onSubmit = (values: BackupSettingsFormValues) => {
    mutation.mutate(JSON.stringify(values), { onSuccess: () => toast.success('Backup settings updated') });
  };

  if (query.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const errorMessage = isRealError(query.error)
    ? (query.error as ApiError).message
    : mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.isError
        ? 'Something went wrong. Please try again.'
        : null;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FieldGroup>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectFormField
            control={form.control}
            name="frequency"
            label="Backup frequency"
            options={[...BACKUP_FREQUENCY_OPTIONS]}
            disabled={!canEdit || mutation.isPending}
          />
          <TextFormField
            control={form.control}
            name="retentionDays"
            label="Retention (days)"
            type="number"
            disabled={!canEdit || mutation.isPending}
          />
        </div>
      </FieldGroup>
      <p className="text-sm text-muted-foreground">
        Last backup: <span className="italic">no backup job runs in this demo</span> — this section only stores the schedule preference.
      </p>
      {errorMessage && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t save backup settings</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Tab shell ────────────────────────────────────────────────────────────────

/**
 * Unlike the top-level Settings sections (Company, Exchange Rates, Users, ...),
 * these four sub-sections are simple forms with nothing to deep-link to, so
 * they use Base UI's content-only `Tabs` (per `finance-nav.tsx`'s own note:
 * "not meant for real URL navigation") rather than their own nested routes.
 */
export function SystemSettingsView() {
  return (
    <SettingsPageShell title="System Settings" description="Tax defaults, outbound email, notifications, and backup schedule.">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Stored as simple key/value settings — see each tab for what it covers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tax">
            <TabsList>
              <TabsTrigger value="tax">Tax</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>
            <TabsContent value="tax" className="pt-4">
              <TaxSettingsForm />
            </TabsContent>
            <TabsContent value="email" className="pt-4">
              <EmailSettingsForm />
            </TabsContent>
            <TabsContent value="notifications" className="pt-4">
              <NotificationSettingsForm />
            </TabsContent>
            <TabsContent value="backup" className="pt-4">
              <BackupSettingsForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </SettingsPageShell>
  );
}
