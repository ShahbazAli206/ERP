'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { visibleNavItems } from '@/lib/nav-config';
import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/lib/utils';

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Deterministic (not random) varying widths for the loading skeleton rows.
const SKELETON_WIDTHS = ['70%', '45%', '80%', '55%', '65%', '85%', '50%', '75%'];

/**
 * Decorative icon-badge accent colours — one per nav position (cycled).
 * These are purely cosmetic: they tint the icon container badge, not data.
 * Six colours chosen to be visually distinct on the dark sidebar background.
 */
const NAV_ICON_ACCENTS = [
  'var(--icon-a)', // violet
  'var(--icon-b)', // magenta
  'var(--icon-c)', // red-orange
  'var(--icon-d)', // amber
  'var(--icon-e)', // teal
  'var(--icon-f)', // blue
];

/**
 * Module navigation sidebar.
 *
 * Renders a dark-indigo rail with:
 *  - coloured icon containers that cycle through 6 decorative accent hues
 *  - a glowing gradient highlight on the active item
 *  - a left-edge accent bar on the active item (`.sidebar-active-bar`)
 *  - slightly larger font (0.9 rem) with wide letter-spacing for legibility
 *
 * Items are filtered to only the modules the logged-in user has
 * `"<module>:view"` permission for — this is the ONLY nav visibility rule.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const items = user ? visibleNavItems(user.permissions) : [];

  return (
    <Sidebar collapsible="icon">
      {/* ── Logo / brand header ─────────────────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              {/* Glowing brand icon — visible in both expanded and icon-only modes */}
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-brand-1/40 ring-1 ring-white/20 text-white">
                <Globe2 className="size-4.5" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.95rem] font-bold tracking-wide text-gradient-brand leading-none">
                  ERP Suite
                </span>
                <span className="text-[0.65rem] font-medium uppercase tracking-widest text-sidebar-foreground/45 leading-none">
                  Enterprise Platform
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation items ────────────────────────────────────────────── */}
      <SidebarContent className="pt-2">
        <SidebarGroup>
          {/* Section label — all-caps, muted, with subtle divider */}
          <SidebarGroupLabel className="mb-1 px-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
            Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {/* Loading skeleton rows */}
              {isLoading &&
                SKELETON_WIDTHS.map((width, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon width={width} />
                  </SidebarMenuItem>
                ))}

              {/* Rendered nav items */}
              {!isLoading &&
                items.map((item, i) => {
                  const active = isItemActive(pathname, item.href);
                  const accent = NAV_ICON_ACCENTS[i % NAV_ICON_ACCENTS.length];

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          // Base — slightly taller rows, larger font, wider tracking
                          'relative h-10 gap-3 rounded-lg text-[0.9rem] font-medium tracking-wide transition-all duration-200',
                          active
                            ? // Active — gradient background + glow + left accent bar
                              'sidebar-active-bar sidebar-item-glow bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/8 text-sidebar-accent-foreground'
                            : // Inactive — subtle hover
                              'text-sidebar-foreground/75 hover:text-sidebar-foreground',
                        )}
                      >
                        {/* Coloured icon container — accent bg badge */}
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                            active
                              ? 'shadow-md ring-1 ring-white/20'
                              : 'bg-sidebar-foreground/8 group-hover:bg-sidebar-foreground/14',
                          )}
                          style={{
                            // Active: use the accent as background (tinted); Inactive: just colour the icon
                            background: active
                              ? `color-mix(in oklch, ${accent}, transparent 25%)`
                              : undefined,
                            boxShadow: active
                              ? `0 4px 12px -4px color-mix(in oklch, ${accent}, transparent 35%)`
                              : undefined,
                            color: accent,
                          }}
                        >
                          <item.icon className="size-4" />
                        </span>

                        <span className="flex-1 truncate">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

              {/* Empty-permissions fallback */}
              {!isLoading && items.length === 0 && (
                <p className="px-3 py-2 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                  No modules available for your role.
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
