'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

const SECTIONS: { href: string; label: string }[] = [
  { href: '/inventory', label: 'Overview' },
  { href: '/inventory/products', label: 'Products' },
  { href: '/inventory/categories', label: 'Categories' },
  { href: '/inventory/warehouses', label: 'Warehouses' },
  { href: '/inventory/goods-receipt', label: 'Goods Receipt' },
  { href: '/inventory/adjustments', label: 'Adjustments' },
  { href: '/inventory/alerts', label: 'Alerts' },
  { href: '/inventory/valuation', label: 'Valuation' },
];

/**
 * Horizontal section nav for the Inventory module — this module has too much
 * content (7+ distinct views: catalog, categories, warehouses, goods
 * receipt, adjustments, alerts, valuation) to fit on one page or in Base
 * UI's content-only `Tabs` (which isn't meant for real URL navigation), so
 * each section is its own nested route under `/inventory/*` and this renders
 * as a link strip using `buttonVariants()` directly on `<Link>` — not the
 * `Button` primitive's `render` prop, per this repo's Next 16 / Base UI
 * convention that links should never be a repurposed `<button>`.
 */
export function InventorySubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Inventory sections" className="flex flex-wrap gap-1.5 border-b pb-3">
      {SECTIONS.map((section) => {
        const isActive = section.href === '/inventory' ? pathname === '/inventory' : pathname.startsWith(section.href);
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

/**
 * Standard per-section shell: page title/description/actions + the sub-nav
 * strip below it. Every `/inventory/*` page renders this once at the top so
 * the section nav is consistent without a nested `layout.tsx` that would
 * force a single shared header across sections with very different titles.
 */
export function InventoryPageShell({
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
      <InventorySubNav />
      {children}
    </>
  );
}
