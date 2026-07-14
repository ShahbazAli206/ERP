'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NAV_ITEMS } from '@/lib/nav-config';

const LABEL_OVERRIDES: Record<string, string> = {
  profile: 'Profile',
  ai: 'AI Dashboard',
  tax: 'Tax & Compliance',
};

function labelForSegment(segment: string): string {
  const navMatch = NAV_ITEMS.find((item) => item.href === `/${segment}`);
  if (navMatch) return navMatch.label;
  if (LABEL_OVERRIDES[segment]) return LABEL_OVERRIDES[segment];
  // Fallback for Phase 8 detail-page segments (e.g. an id) or unknown routes:
  // decode/prettify kebab-case, otherwise show as-is.
  const decoded = decodeURIComponent(segment);
  return /^[a-z0-9-]+$/i.test(decoded) && /[a-z]/i.test(decoded)
    ? decoded.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : decoded;
}

/**
 * Auto-generated from the current pathname — no per-page configuration
 * needed. Phase 8 detail pages (e.g. `/suppliers/[id]`) get a reasonable
 * default breadcrumb for free; override by rendering a custom breadcrumb
 * trail in the page itself only if the default segment-based label isn't
 * good enough (e.g. showing a supplier's name instead of its id).
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{labelForSegment(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>{labelForSegment(segment)}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
