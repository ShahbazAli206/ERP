'use client';

import Link from 'next/link';
import {
  BuildingIcon,
  DollarSignIcon,
  PackageIcon,
  PercentIcon,
  ScaleIcon,
  ShoppingCartIcon,
  WalletIcon,
  WarehouseIcon,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportsPageShell } from './reports-nav';

const REPORTS: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: '/reports/sales', label: 'Sales Report', description: 'Orders and totals for a date range.', icon: ShoppingCartIcon },
  { href: '/reports/purchases', label: 'Purchase Report', description: 'Purchase orders and base-currency totals.', icon: PackageIcon },
  { href: '/reports/inventory', label: 'Inventory Report', description: 'Valuation, low stock and expiry flags.', icon: WarehouseIcon },
  { href: '/reports/profit', label: 'Profit Report', description: 'Income, COGS, expenses and net profit.', icon: DollarSignIcon },
  { href: '/reports/cash-flow', label: 'Cash Flow Report', description: 'Incoming/outgoing payments by day.', icon: ScaleIcon },
  { href: '/reports/suppliers', label: 'Supplier Report', description: 'Committed purchase value and balances.', icon: BuildingIcon },
  { href: '/reports/distributors', label: 'Distributor Report', description: 'Committed sales value and balances.', icon: BuildingIcon },
  { href: '/reports/expenses', label: 'Expense Report', description: 'Expenses grouped by category.', icon: WalletIcon },
  { href: '/reports/tax', label: 'Tax Report', description: 'Estimated tax liability by type.', icon: PercentIcon },
];

export function ReportsOverviewView() {
  return (
    <ReportsPageShell
      title="Reports"
      description="Cross-module reports with PDF/Excel export and print-friendly views. Pick a report below."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader>
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle className="mt-2">{report.label}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          );
        })}
      </div>
    </ReportsPageShell>
  );
}
