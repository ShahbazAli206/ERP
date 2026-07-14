'use client';

import { InventoryPageShell } from '@/features/inventory/inventory-nav';
import { ValuationView } from '@/features/inventory/valuation-view';

export default function Page() {
  return (
    <InventoryPageShell title="Inventory Valuation" description="Current stock value by product, quantity × cost price.">
      <ValuationView />
    </InventoryPageShell>
  );
}
