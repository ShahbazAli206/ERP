'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/notifications', label: 'Notification Center' },
  { href: '/notifications/channels', label: 'Channels' },
  { href: '/notifications/settings', label: 'Settings' },
];

/**
 * Horizontal section nav for the Notifications module — three distinct views
 * (the real notification center, the channel placeholders, and the
 * reminder/alert settings) each get their own nested route under
 * `/notifications/*`, mirroring `src/features/expenses/components/expenses-nav.tsx`
 * / `src/features/tax/tax-nav.tsx`'s pattern rather than cramming everything
 * onto one page or into Base UI's content-only `Tabs`.
 */
export function NotificationsSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Notifications sections" className="flex flex-wrap gap-1.5 border-b pb-3">
      {SECTIONS.map((section) => {
        const isActive =
          section.href === '/notifications' ? pathname === '/notifications' : pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }))}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Standard per-section shell: page title/description/actions + the sub-nav strip below it. */
export function NotificationsPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} description={description} actions={actions} />
      <NotificationsSubNav />
      {children}
    </>
  );
}
