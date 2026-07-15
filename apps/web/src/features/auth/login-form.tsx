'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { TextFormField } from '@/components/shared/form-fields';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TriangleAlertIcon, ShieldCheckIcon } from 'lucide-react';
import { loginSchema, type LoginFormValues } from './schemas';
import { authApi } from './api';
import { setSessionToken } from '@/lib/session';
import { AUTH_ME_QUERY_KEY } from './use-auth';
import { ApiError } from '@/lib/api-client';

/**
 * Demo accounts seeded by `apps/api/prisma/seed.ts`.
 * All share the same password — selecting a role auto-fills both fields.
 */
const DEMO_PASSWORD = 'Demo@1234';

const DEMO_ACCOUNTS = [
  { role: 'Super Admin',          name: 'Ayesha Khan',   email: 'admin@erp.local' },
  { role: 'Procurement Officer',  name: 'Bilal Ahmed',   email: 'procurement@erp.local' },
  { role: 'Inventory Manager',    name: 'Sana Malik',    email: 'inventory@erp.local' },
  { role: 'Sales Manager',        name: 'Usman Tariq',   email: 'sales@erp.local' },
  { role: 'Accountant',           name: 'Fatima Iqbal',  email: 'accounts@erp.local' },
  { role: 'Executive',            name: 'Omar Sheikh',   email: 'executive@erp.local' },
] as const;

const DEFAULT_ACCOUNT = DEMO_ACCOUNTS[0]; // Super Admin

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ACCOUNT.role);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: DEFAULT_ACCOUNT.email, password: DEMO_PASSWORD },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      setFormError(null);
      setSessionToken(result.token, result.expiresIn);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, result.user);
      const redirectTo = searchParams.get('from') ?? '/dashboard';
      router.replace(redirectTo);
    },
    onError: (error) => {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    },
  });

  /** When a role is selected, auto-fill its credentials into the form. */
  function handleRoleChange(role: string) {
    setSelectedRole(role);
    const account = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (account) {
      form.setValue('email', account.email, { shouldValidate: true });
      form.setValue('password', DEMO_PASSWORD, { shouldValidate: true });
      setFormError(null);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="space-y-6"
    >
      {/* ── Quick role picker (dev convenience) ─────────────────────────── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheckIcon className="size-3.5 text-primary/70" />
          Quick sign-in as
        </Label>
        <Select value={selectedRole} onValueChange={handleRoleChange} disabled={mutation.isPending}>
          <SelectTrigger className="w-full border-primary/25 bg-primary/5 text-sm font-medium hover:bg-primary/10 transition-colors">
            <SelectValue placeholder="Select a role…" />
          </SelectTrigger>
          <SelectContent>
            {DEMO_ACCOUNTS.map((account) => (
              <SelectItem key={account.role} value={account.role}>
                <span className="font-medium">{account.role}</span>
                <span className="ml-1.5 text-muted-foreground">— {account.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.68rem] text-muted-foreground/70">
          Select a role to auto-fill credentials, or edit manually below.
        </p>
      </div>

      {/* ── Email & password fields (editable) ──────────────────────────── */}
      <FieldGroup>
        <TextFormField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          disabled={mutation.isPending}
        />
        <TextFormField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={mutation.isPending}
        />
      </FieldGroup>

      {formError && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Couldn&apos;t sign you in</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Spinner />}
        Sign in
      </Button>
    </form>
  );
}
