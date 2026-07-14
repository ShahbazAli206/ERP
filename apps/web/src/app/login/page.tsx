import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/layout/auth-shell';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in — ERP Demo',
};

/**
 * `LoginForm` reads `useSearchParams()` (for the post-login `?from=` redirect
 * target set by `src/proxy.ts`), which requires a Suspense boundary around
 * it for the production build to succeed (Next.js opts client pages using
 * this hook out of static rendering otherwise).
 */
export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Enter your credentials to access the ERP dashboard"
      footer={
        <Link href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
          Forgot your password?
        </Link>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
