'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes } from 'lucide-react';
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

function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Deterministic (not random) varying widths for the loading skeleton rows —
// see the comment on SidebarMenuSkeleton in components/ui/sidebar.tsx for why.
const SKELETON_WIDTHS = ['70%', '45%', '80%', '55%', '65%', '85%', '50%', '75%'];

/** Same decorative icon-accent cycle as StatCard — purely cosmetic nav color, not data-encoding. */
const NAV_ICON_ACCENTS = ['var(--icon-a)', 'var(--icon-b)', 'var(--icon-c)', 'var(--icon-d)', 'var(--icon-e)', 'var(--icon-f)'];

/**
 * Module navigation. Items are filtered to only what the logged-in user has
 * `"<module>:view"` permission for (see `src/lib/nav-config.ts`) — this is
 * the ONLY nav visibility rule in the app, driven entirely by the
 * `permissions` array returned by `GET /api/auth/me`.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const items = user ? visibleNavItems(user.permissions) : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-primary-foreground shadow-sm">
                <Boxes className="size-4" />
              </span>
              <span className="text-sm font-semibold tracking-tight text-gradient-brand">ERP Demo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading &&
                SKELETON_WIDTHS.map((width, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon width={width} />
                  </SidebarMenuItem>
                ))}
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
                        className={active ? 'font-medium' : undefined}
                      >
                        <item.icon style={{ color: active ? accent : undefined }} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              {!isLoading && items.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
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
