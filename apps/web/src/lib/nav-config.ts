import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Truck,
  ShoppingCart,
  Ship,
  Boxes,
  Building2,
  Receipt,
  Landmark,
  Wallet,
  Scale,
  BarChart3,
  Bell,
  Sparkles,
  Settings,
} from 'lucide-react';

/**
 * Single source of truth for the sidebar's module navigation. Order here is
 * the order rendered in the sidebar (per the spec: Dashboard, Suppliers,
 * Procurement, Shipments, Inventory, Distributors, Sales, Finance, Expenses,
 * Tax & Compliance, Reports, Notifications, AI Dashboard, Settings).
 *
 * `permission` is checked against the logged-in user's `permissions: string[]`
 * (from `GET /api/auth/me` / the login response) — an item is shown only if
 * the user has that exact `"<module>:view"` string. This is the ONLY nav
 * visibility rule; there is no separate roles endpoint to consult.
 *
 * Phase 8 module agents: this file does not need to change unless a route
 * itself changes — add sub-navigation (e.g. tabs within a module) at the
 * page level instead.
 */
export interface NavItem {
  label: string;
  href: string;
  /** Module permission key checked as `"<module>:view"`. */
  module: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', module: 'dashboard', icon: LayoutDashboard },
  { label: 'Suppliers', href: '/suppliers', module: 'suppliers', icon: Truck },
  { label: 'Procurement', href: '/procurement', module: 'procurement', icon: ShoppingCart },
  { label: 'Shipments', href: '/shipments', module: 'shipments', icon: Ship },
  { label: 'Inventory', href: '/inventory', module: 'inventory', icon: Boxes },
  { label: 'Distributors', href: '/distributors', module: 'distributors', icon: Building2 },
  { label: 'Sales', href: '/sales', module: 'sales', icon: Receipt },
  { label: 'Finance', href: '/finance', module: 'finance', icon: Landmark },
  { label: 'Expenses', href: '/expenses', module: 'expenses', icon: Wallet },
  { label: 'Tax & Compliance', href: '/tax', module: 'tax', icon: Scale },
  { label: 'Reports', href: '/reports', module: 'reports', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', module: 'notifications', icon: Bell },
  { label: 'AI Dashboard', href: '/ai', module: 'ai', icon: Sparkles },
  { label: 'Settings', href: '/settings', module: 'settings', icon: Settings },
];

/** Returns only the nav items the given permission list grants `:view` on. */
export function visibleNavItems(permissions: string[]): NavItem[] {
  const permissionSet = new Set(permissions);
  return NAV_ITEMS.filter((item) => permissionSet.has(`${item.module}:view`));
}
