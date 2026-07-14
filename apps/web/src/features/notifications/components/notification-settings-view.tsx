'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InfoIcon, LockIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { CheckboxFormField } from '@/components/shared/form-fields';
import { useAuth } from '@/features/auth/use-auth';
import { useSetSystemSetting, useSystemSetting } from '../hooks';
import {
  ALERT_SETTINGS_KEY,
  DEFAULT_ALERT_SETTINGS,
  DEFAULT_REMINDER_SETTINGS,
  REMINDER_SETTINGS_KEY,
  alertSettingsSchema,
  reminderSettingsSchema,
  type AlertSettingsValues,
  type ReminderSettingsValues,
} from '../schemas';

/** Best-effort JSON parse — falls back to defaults for a missing/corrupt stored value rather than throwing. */
function parseStoredValue<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

/**
 * Reminder/Alert Settings section.
 *
 * Judgment call (see task spec / IMPLEMENTATION_PLAN.md): there's no
 * dedicated backend table for these — they're stored as JSON strings under
 * the generic `system_settings` key-value store (`GET/PUT
 * /settings/system/:key`), which is itself gated on `settings:view` /
 * `settings:edit`. Since only Super Admin and Executive ever reach this page
 * at all (nav is gated on `notifications:view`, which only those two roles
 * have — see `api.ts`'s docstring), and Executive's role is `view(<every
 * module>)` with no `:edit` anywhere (see `ROLE_PERMISSIONS.Executive` in
 * `apps/api/src/shared/constants/permissions.ts`), the two realistic cases
 * are: Super Admin (can view + edit) and Executive (can view, read-only).
 * Rather than hide the section for Executive, it renders read-only —
 * disabled fields with a note — so "view-only everywhere" holds here too,
 * consistent with the rest of the app.
 */
export function NotificationSettingsView() {
  const { hasPermission } = useAuth();
  const canView = hasPermission('settings:view');
  const canEdit = hasPermission('settings:edit');

  if (!canView) {
    return (
      <Alert className="mt-6">
        <LockIcon />
        <AlertTitle>Settings unavailable</AlertTitle>
        <AlertDescription>
          Viewing reminder and alert settings requires the settings:view permission, which your role doesn&apos;t
          have.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {!canEdit && (
        <Alert>
          <InfoIcon />
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>
            Your role can view these settings but not change them — editing requires the settings:edit permission
            (Super Admin only).
          </AlertDescription>
        </Alert>
      )}

      <ReminderSettingsCard canEdit={canEdit} />
      <AlertSettingsCard canEdit={canEdit} />
    </div>
  );
}

function ReminderSettingsCard({ canEdit }: { canEdit: boolean }) {
  const query = useSystemSetting(REMINDER_SETTINGS_KEY);
  const mutation = useSetSystemSetting(REMINDER_SETTINGS_KEY);

  const form = useForm<ReminderSettingsValues>({
    resolver: zodResolver(reminderSettingsSchema),
    defaultValues: DEFAULT_REMINDER_SETTINGS,
  });

  useEffect(() => {
    if (query.isLoading) return;
    form.reset(parseStoredValue(query.data?.value, DEFAULT_REMINDER_SETTINGS));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the fetched value itself changes
  }, [query.data, query.isLoading]);

  const onSubmit = (values: ReminderSettingsValues) => mutation.mutate(JSON.stringify(values));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminder Settings</CardTitle>
        <CardDescription>Which recurring reminders should surface as in-app notifications.</CardDescription>
        {query.isLoading && (
          <CardAction>
            <Spinner className="size-4" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <CheckboxFormField
              control={form.control}
              name="lowStockReminders"
              label="Low stock reminders"
              description="Notify when inventory items fall below their reorder level."
              disabled={!canEdit}
            />
            <CheckboxFormField
              control={form.control}
              name="paymentDueReminders"
              label="Payment due reminders"
              description="Notify ahead of upcoming/overdue supplier or distributor payments."
              disabled={!canEdit}
            />
            <CheckboxFormField
              control={form.control}
              name="shipmentEtaReminders"
              label="Shipment ETA reminders"
              description="Notify as an in-transit shipment approaches its expected arrival date."
              disabled={!canEdit}
            />
            {canEdit && (
              <Button type="submit" size="sm" className="w-fit" disabled={mutation.isPending}>
                {mutation.isPending ? <Spinner className="size-4" /> : null}
                Save reminder settings
              </Button>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

function AlertSettingsCard({ canEdit }: { canEdit: boolean }) {
  const query = useSystemSetting(ALERT_SETTINGS_KEY);
  const mutation = useSetSystemSetting(ALERT_SETTINGS_KEY);

  const form = useForm<AlertSettingsValues>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: DEFAULT_ALERT_SETTINGS,
  });

  useEffect(() => {
    if (query.isLoading) return;
    form.reset(parseStoredValue(query.data?.value, DEFAULT_ALERT_SETTINGS));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the fetched value itself changes
  }, [query.data, query.isLoading]);

  const onSubmit = (values: AlertSettingsValues) => mutation.mutate(JSON.stringify(values));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Settings</CardTitle>
        <CardDescription>
          Which external channels alerts would go out on, in addition to the in-app notification center.
        </CardDescription>
        {query.isLoading && (
          <CardAction>
            <Spinner className="size-4" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <InfoIcon />
          <AlertDescription>
            These channels are placeholders in this demo (see the Channels tab) — toggling them here records intent
            in the settings store but doesn&apos;t change what actually gets dispatched.
          </AlertDescription>
        </Alert>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <CheckboxFormField control={form.control} name="emailAlerts" label="Email" disabled={!canEdit} />
            <CheckboxFormField control={form.control} name="smsAlerts" label="SMS" disabled={!canEdit} />
            <CheckboxFormField control={form.control} name="whatsappAlerts" label="WhatsApp" disabled={!canEdit} />
            <CheckboxFormField control={form.control} name="pushAlerts" label="Push" disabled={!canEdit} />
            {canEdit && (
              <Button type="submit" size="sm" className="w-fit" disabled={mutation.isPending}>
                {mutation.isPending ? <Spinner className="size-4" /> : null}
                Save alert settings
              </Button>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
