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
import { TextFormField } from '@/components/shared/form-fields';
import { useAuth } from '@/features/auth/use-auth';
import { ApiError } from '@/lib/api-client';
import { SettingsPageShell } from './settings-nav';
import { companySettingsSchema, type CompanySettingsFormInput, type CompanySettingsFormValues } from './schemas';
import { useCompanySettings, useUpdateCompanySettings } from './hooks';

const EMPTY_DEFAULTS: CompanySettingsFormInput = {
  companyName: '',
  address: '',
  phone: '',
  email: '',
  baseCurrency: '',
};

/**
 * Company Information + Currency. The backend has a single `CompanySettingDto`
 * singleton covering both — `baseCurrency` IS the "Currency" section of the
 * spec, there's no separate endpoint for it (see `apps/api/src/modules/settings/companySettings.*`).
 */
export function CompanySettingsView() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings:edit');

  const query = useCompanySettings();
  const mutation = useUpdateCompanySettings();

  const form = useForm<CompanySettingsFormInput, unknown, CompanySettingsFormValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  useEffect(() => {
    if (!query.data) return;
    form.reset({
      companyName: query.data.companyName,
      address: query.data.address ?? '',
      phone: query.data.phone ?? '',
      email: query.data.email ?? '',
      baseCurrency: query.data.baseCurrency,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the fetched record changes
  }, [query.data]);

  const onSubmit = (values: CompanySettingsFormValues) => {
    mutation.mutate(
      { ...values, address: values.address || undefined, phone: values.phone || undefined, email: values.email || undefined },
      {
        onSuccess: () => toast.success('Company settings updated'),
      },
    );
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.isError ? 'Something went wrong. Please try again.' : null;

  return (
    <SettingsPageShell title="Settings" description="Company profile, currency, and system-wide configuration.">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>The company profile shown on invoices and reports, plus the base currency used across Finance.</CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
              <FieldGroup>
                <TextFormField
                  control={form.control}
                  name="companyName"
                  label="Company name"
                  placeholder="Meridian Gateway Trading Co. (Pvt) Ltd."
                  disabled={!canEdit || mutation.isPending}
                />
                <TextFormField
                  control={form.control}
                  name="address"
                  label="Address"
                  placeholder="Plot 14, Sector 22, Korangi Industrial Area, Karachi"
                  disabled={!canEdit || mutation.isPending}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextFormField control={form.control} name="phone" label="Phone" placeholder="+92-21-3550-9871" disabled={!canEdit || mutation.isPending} />
                  <TextFormField
                    control={form.control}
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="info@example.com"
                    disabled={!canEdit || mutation.isPending}
                  />
                </div>
                <TextFormField
                  control={form.control}
                  name="baseCurrency"
                  label="Base currency"
                  description="3-letter ISO code (e.g. PKR, USD). Used as the reporting currency across Finance."
                  placeholder="PKR"
                  className="sm:max-w-40"
                  disabled={!canEdit || mutation.isPending}
                />
              </FieldGroup>

              {errorMessage && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>Couldn&apos;t save company settings</AlertTitle>
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
          )}
        </CardContent>
      </Card>
    </SettingsPageShell>
  );
}
