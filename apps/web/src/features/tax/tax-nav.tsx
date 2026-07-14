'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/tax', label: 'Tax Rates' },
  { href: '/tax/compliance-dashboard', label: 'Compliance Dashboard' },
  { href: '/tax/e-invoice', label: 'E-Invoice' },
  { href: '/tax/audit-logs', label: 'Audit Logs' },
];

/**
 * Horizontal section nav for the Tax & Compliance module — four distinct views (rates CRUD,
 * compliance dashboard, e-invoice placeholder, audit logs) each get their own nested route under
 * `/tax/*` rather than being crammed onto one page or into Base UI's content-only `Tabs` (which
 * isn't meant for real URL navigation). Mirrors `src/features/inventory/inventory-nav.tsx`'s
 * pattern — kept as a separate copy per this module's folder boundary rather than promoting it to
 * a shared component.
 */
export function TaxSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Tax sections" className="flex flex-wrap gap-1.5 border-b pb-3">
      {SECTIONS.map((section) => {
        const isActive = section.href === '/tax' ? pathname === '/tax' : pathname.startsWith(section.href);
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
export function TaxPageShell({
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
      <TaxSubNav />
      {children}
    </>
  );
}
