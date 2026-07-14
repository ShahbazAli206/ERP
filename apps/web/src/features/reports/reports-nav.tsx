'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/reports', label: 'Overview' },
  { href: '/reports/sales', label: 'Sales' },
  { href: '/reports/purchases', label: 'Purchases' },
  { href: '/reports/inventory', label: 'Inventory' },
  { href: '/reports/profit', label: 'Profit' },
  { href: '/reports/cash-flow', label: 'Cash Flow' },
  { href: '/reports/suppliers', label: 'Suppliers' },
  { href: '/reports/distributors', label: 'Distributors' },
  { href: '/reports/expenses', label: 'Expenses' },
  { href: '/reports/tax', label: 'Tax' },
];

/** Horizontal section nav for the Reports module — mirrors `features/finance/finance-nav.tsx`'s pattern. */
export function ReportsSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Report sections" className="flex flex-wrap gap-1.5 border-b pb-3 print:hidden">
      {SECTIONS.map((section) => {
        const isActive = section.href === '/reports' ? pathname === '/reports' : pathname.startsWith(section.href);
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

/** Standard per-report shell: page title/description + the sub-nav strip (both hidden when printing). */
export function ReportsPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="print:hidden">
        <PageHeader title={title} description={description} />
      </div>
      <ReportsSubNav />
      <div className="mt-4">{children}</div>
    </>
  );
}
