'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatLastSaleDate } from './format';
import { useSlowMovingInventory } from './hooks';

/**
 * Real aggregation — in-stock products with no sale in the last 60 days
 * (`aiService.slowMovingInventory()`, `apps/api/src/modules/ai/ai.service.ts`). No "demo data"
 * badge here, unlike the other four sections: this is actual inventory/sales data, not generated.
 */
export function SlowMovingInventoryView() {
  const query = useSlowMovingInventory();
  const items = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slow Moving Inventory</CardTitle>
        <CardDescription>In-stock products with no sale in the last 60 days</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock on Hand</TableHead>
                <TableHead>Last Sale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {query.isError
                      ? "Couldn't load slow-moving inventory. Try refreshing the page."
                      : 'No slow-moving stock right now — everything in stock has sold recently.'}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.stockOnHand.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{formatLastSaleDate(item.lastSaleDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
