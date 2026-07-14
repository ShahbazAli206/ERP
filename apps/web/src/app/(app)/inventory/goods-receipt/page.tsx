'use client';

import { InventoryPageShell } from '@/features/inventory/inventory-nav';
import { GoodsReceiptView } from '@/features/inventory/goods-receipt-view';

export default function Page() {
  return (
    <InventoryPageShell title="Goods Receipt" description="Record incoming stock into a warehouse, optionally against a purchase order.">
      <GoodsReceiptView />
    </InventoryPageShell>
  );
}
