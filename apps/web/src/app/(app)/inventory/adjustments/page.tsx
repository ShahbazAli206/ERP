'use client';

import { InventoryPageShell } from '@/features/inventory/inventory-nav';
import { StockAdjustmentView } from '@/features/inventory/stock-adjustment-view';

export default function Page() {
  return (
    <InventoryPageShell title="Stock Adjustment" description="Manually increase or decrease stock, with a reason, for audit purposes.">
      <StockAdjustmentView />
    </InventoryPageShell>
  );
}
