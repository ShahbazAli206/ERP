import Link from 'next/link';
import { Boxes } from 'lucide-react';
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
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-6 flex items-center justify-center gap-2 text-foreground">
          <Boxes className="size-6" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">ERP Demo</span>
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
