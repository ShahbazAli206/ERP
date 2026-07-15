'use client';

import Link from 'next/link';
import { Boxes } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Shared centered-card chrome for the public auth pages (/login,
 * /forgot-password). Keeps their branding/layout consistent without
 * duplicating markup.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6">
      <div className="auth-backdrop" aria-hidden>
        <span className="top-[-12rem] left-[-8rem] h-[34rem] w-[34rem] bg-(--brand-1)" />
        <span className="right-[-10rem] bottom-[-14rem] h-[30rem] w-[30rem] bg-(--brand-2) [animation-delay:-6s]" />
        <span className="top-[20%] right-[10%] h-[18rem] w-[18rem] bg-(--brand-3) [animation-delay:-12s]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Link href="/login" className="mb-6 flex items-center justify-center gap-2 text-foreground">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-brand shadow-md ring-glow">
            <Boxes className="size-5 text-primary-foreground" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight text-gradient-brand">ERP Demo</span>
        </Link>
        <Card className="glass shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </motion.div>
    </div>
  );
}
