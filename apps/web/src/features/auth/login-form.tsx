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
import { TriangleAlertIcon } from 'lucide-react';
import { loginSchema, type LoginFormValues } from './schemas';
import { authApi } from './api';
import { setSessionToken } from '@/lib/session';
import { AUTH_ME_QUERY_KEY } from './use-auth';
import { ApiError } from '@/lib/api-client';

/**
 * Reference implementation of the RHF + Zod + shadcn form convention (see
 * `src/components/shared/form-fields.tsx` for the full writeup). Every
 * future module form — create/edit dialogs, filters, settings forms — should
 * follow this exact shape:
 *
 *   useForm(zodResolver) -> <TextFormField control={form.control} .../> ->
 *   form.handleSubmit(mutation.mutate)
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
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

  return (
    <form
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
      className="space-y-6"
    >
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
