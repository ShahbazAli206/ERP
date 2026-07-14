'use client';

import { InventoryPageShell } from '@/features/inventory/inventory-nav';
import { InventoryOverviewView } from '@/features/inventory/overview-view';

export default function Page() {
  return (
    <InventoryPageShell title="Inventory" description="Stock levels, goods receipt, and low-stock/expiry alerts.">
      <InventoryOverviewView />
    </InventoryPageShell>
  );
}
