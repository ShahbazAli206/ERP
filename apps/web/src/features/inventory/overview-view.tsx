'use client';

import Link from 'next/link';
import { AlertTriangleIcon, BoxesIcon, CalendarClockIcon, DollarSignIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpiryAlerts, useLowStockAlerts, useProducts, useValuation } from './hooks';

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const QUICK_LINKS = [
  { href: '/inventory/products', title: 'Product Catalog', description: 'Browse SKUs, barcodes, categories, and stock levels.' },
  { href: '/inventory/goods-receipt', title: 'Goods Receipt', description: 'Receive stock into a warehouse, optionally against a PO.' },
  { href: '/inventory/adjustments', title: 'Stock Adjustment', description: 'Manually increase or decrease stock with a reason.' },
  { href: '/inventory/alerts', title: 'Alerts', description: 'Low-stock products and lots approaching expiry.' },
  { href: '/inventory/valuation', title: 'Valuation', description: 'Inventory value by product and category.' },
  { href: '/inventory/categories', title: 'Categories', description: 'Manage the product category tree.' },
];

export function InventoryOverviewView() {
  const productsQuery = useProducts({ page: 1, pageSize: 1, isActive: true });
  const lowStockQuery = useLowStockAlerts();
  const expiryQuery = useExpiryAlerts(30);
  const valuationQuery = useValuation();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active products"
          value={productsQuery.data?.pagination.total ?? '—'}
          icon={BoxesIcon}
          isLoading={productsQuery.isLoading}
        />
        <StatCard
          title="Low stock alerts"
          value={lowStockQuery.data?.length ?? '—'}
          icon={AlertTriangleIcon}
          description="Products at or below reorder level"
          isLoading={lowStockQuery.isLoading}
        />
        <StatCard
          title="Expiring within 30 days"
          value={expiryQuery.data?.length ?? '—'}
          icon={CalendarClockIcon}
          description="Includes already-expired lots"
          isLoading={expiryQuery.isLoading}
        />
        <StatCard
          title="Total inventory value"
          value={valuationQuery.data ? formatMoney(valuationQuery.data.grandTotal) : '—'}
          icon={DollarSignIcon}
          isLoading={valuationQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="block">
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
