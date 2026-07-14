'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import { TextFormField } from '@/components/shared/form-fields';
import { Spinner } from '@/components/ui/spinner';
import { CircleCheckIcon } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from './schemas';
import { authApi } from './api';

/**
 * The backend always returns the same generic success message regardless of
 * whether the email exists (mock, no real email is sent — see
 * `apps/api/src/modules/auth/auth.service.ts#forgotPassword`), so this form
 * never shows a "user not found" style error — that would leak which
 * emails are registered.
 */
export function ForgotPasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (result) => setSuccessMessage(result.message),
  });

  if (successMessage) {
    return (
      <Alert>
        <CircleCheckIcon />
        <AlertTitle>Check your email</AlertTitle>
        <AlertDescription>{successMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate className="space-y-6">
      <FieldGroup>
        <TextFormField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          disabled={mutation.isPending}
          description="We'll send a reset link if an account exists for this email."
        />
      </FieldGroup>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Spinner />}
        Send reset link
      </Button>
    </form>
  );
}
