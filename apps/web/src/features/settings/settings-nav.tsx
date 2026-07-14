'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/settings', label: 'Company' },
  { href: '/settings/exchange-rates', label: 'Exchange Rates' },
  { href: '/settings/users', label: 'Users' },
  { href: '/settings/roles', label: 'Roles & Permissions' },
  { href: '/settings/system', label: 'System Settings' },
  { href: '/settings/system-logs', label: 'System Logs' },
];

/**
 * Horizontal section nav for the Settings module — mirrors
 * `features/finance/finance-nav.tsx`'s pattern: too many distinct concerns
 * (company profile, exchange rate CRUD, read-only user/role listings, four
 * small system-settings forms, an audit log) to fit on one page or in Base
 * UI's content-only `Tabs` (not meant for real URL navigation), so each
 * section is its own nested route under `/settings/*` and this renders a
 * link strip using `buttonVariants()` directly on `<Link>` — not the
 * `Button` primitive's `render` prop, per this repo's Next 16 / Base UI
 * convention.
 */
export function SettingsSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="flex flex-wrap gap-1.5 border-b pb-3">
      {SECTIONS.map((section) => {
        const isActive = section.href === '/settings' ? pathname === '/settings' : pathname.startsWith(section.href);
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
export function SettingsPageShell({
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
      <SettingsSubNav />
      {children}
    </>
  );
}
