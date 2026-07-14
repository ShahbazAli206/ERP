'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/finance', label: 'Overview' },
  { href: '/finance/bank-accounts', label: 'Bank Accounts' },
  { href: '/finance/chart-of-accounts', label: 'Chart of Accounts' },
  { href: '/finance/journal-entries', label: 'Journal Entries' },
  { href: '/finance/reports', label: 'Reports' },
];

/**
 * Horizontal section nav for the Finance module — mirrors
 * `features/inventory/inventory-nav.tsx`'s pattern: too much content (ledger,
 * journal entries, bank accounts, six report views) to fit on one page or in
 * Base UI's content-only `Tabs` (not meant for real URL navigation), so each
 * section is its own nested route under `/finance/*` and this renders a link
 * strip using `buttonVariants()` directly on `<Link>` — not the `Button`
 * primitive's `render` prop, per this repo's Next 16 / Base UI convention.
 */
export function FinanceSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Finance sections" className="flex flex-wrap gap-1.5 border-b pb-3">
      {SECTIONS.map((section) => {
        const isActive = section.href === '/finance' ? pathname === '/finance' : pathname.startsWith(section.href);
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
export function FinancePageShell({
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
      <FinanceSubNav />
      {children}
    </>
  );
}

const REPORT_SECTIONS: { href: string; label: string }[] = [
  { href: '/finance/reports', label: 'Overview' },
  { href: '/finance/reports/profit-loss', label: 'Profit & Loss' },
  { href: '/finance/reports/balance-sheet', label: 'Balance Sheet' },
  { href: '/finance/reports/cash-flow', label: 'Cash Flow' },
  { href: '/finance/reports/receivables', label: 'Receivables' },
  { href: '/finance/reports/payables', label: 'Payables' },
];

/** Second-level nav within the Reports section, rendered below `FinanceSubNav`. */
export function ReportsSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Finance report sections" className="flex flex-wrap gap-1.5">
      {REPORT_SECTIONS.map((section) => {
        const isActive =
          section.href === '/finance/reports' ? pathname === '/finance/reports' : pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={cn(buttonVariants({ variant: isActive ? 'secondary' : 'outline', size: 'sm' }))}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
