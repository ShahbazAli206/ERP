import type { LucideIcon } from 'lucide-react';
import {
  Globe2,        // Dashboard — worldwide ERP view
  Factory,       // Suppliers — manufacturing source
  PackageSearch, // Procurement — searching/ordering goods
  Plane,         // Shipments — global cargo transit
  Warehouse,     // Inventory — warehouse stock management
  Network,       // Distributors — distribution network
  TrendingUp,    // Sales — revenue growth
  CircleDollarSign, // Finance — monetary management
  CreditCard,    // Expenses — spending tracking
  FileCheck2,    // Tax & Compliance — regulatory filing
  LineChart,     // Reports — analytics & insights
  BellRing,      // Notifications — active alerts
  Brain,         // AI Dashboard — intelligent analytics
  SlidersHorizontal, // Settings — system configuration
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
  { label: 'Dashboard',       href: '/dashboard',     module: 'dashboard',     icon: Globe2 },
  { label: 'Suppliers',       href: '/suppliers',     module: 'suppliers',     icon: Factory },
  { label: 'Procurement',     href: '/procurement',   module: 'procurement',   icon: PackageSearch },
  { label: 'Shipments',       href: '/shipments',     module: 'shipments',     icon: Plane },
  { label: 'Inventory',       href: '/inventory',     module: 'inventory',     icon: Warehouse },
  { label: 'Distributors',    href: '/distributors',  module: 'distributors',  icon: Network },
  { label: 'Sales',           href: '/sales',         module: 'sales',         icon: TrendingUp },
  { label: 'Finance',         href: '/finance',       module: 'finance',       icon: CircleDollarSign },
  { label: 'Expenses',        href: '/expenses',      module: 'expenses',      icon: CreditCard },
  { label: 'Tax & Compliance',href: '/tax',           module: 'tax',           icon: FileCheck2 },
  { label: 'Reports',         href: '/reports',       module: 'reports',       icon: LineChart },
  { label: 'Notifications',   href: '/notifications', module: 'notifications', icon: BellRing },
  { label: 'AI Dashboard',    href: '/ai',            module: 'ai',            icon: Brain },
  { label: 'Settings',        href: '/settings',      module: 'settings',      icon: SlidersHorizontal },
];

/** Returns only the nav items the given permission list grants `:view` on. */
export function visibleNavItems(permissions: string[]): NavItem[] {
  const permissionSet = new Set(permissions);
  return NAV_ITEMS.filter((item) => permissionSet.has(`${item.module}:view`));
}
