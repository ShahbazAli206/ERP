'use client';

import { InventoryPageShell } from '@/features/inventory/inventory-nav';
import { AlertsView } from '@/features/inventory/alerts-view';

export default function Page() {
  return (
    <InventoryPageShell title="Inventory Alerts" description="Products under reorder level and lots approaching expiry.">
      <AlertsView />
    </InventoryPageShell>
  );
}
