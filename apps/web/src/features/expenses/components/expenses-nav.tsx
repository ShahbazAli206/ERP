'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/expenses', label: 'Expenses' },
  { href: '/expenses/categories', label: 'Categories' },
  { href: '/expenses/report', label: 'Report' },
];

/**
 * Horizontal section nav for the Expenses module — mirrors
 * `features/inventory/inventory-nav.tsx`'s pattern: each section (list,
 * categories, report) is its own nested route under `/expenses/*` rather than
 * fighting into one page or Base UI's content-only `Tabs`, so back/forward
 * and deep-linking (e.g. sharing a report URL) work like real navigation.
 */
export function ExpensesSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Expenses sections" className="flex flex-wrap gap-1.5 border-b pb-3">
      {SECTIONS.map((section) => {
        const isActive = section.href === '/expenses' ? pathname === '/expenses' : pathname.startsWith(section.href);
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
export function ExpensesPageShell({
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
      <ExpensesSubNav />
      {children}
    </>
  );
}
