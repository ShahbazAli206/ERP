'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBestSellingProducts } from './hooks';

/**
 * Real aggregation — top 10 products by quantity sold on delivered orders
 * (`aiService.bestSellingProducts()`, `apps/api/src/modules/ai/ai.service.ts`). No "demo data"
 * badge here, unlike the other four sections: this is actual sales data, not generated.
 */
export function BestSellingProductsView() {
  const query = useBestSellingProducts();
  const products = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Selling Products</CardTitle>
        <CardDescription>Top 10 products by quantity sold on delivered orders</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity Sold</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    {query.isError ? "Couldn't load best sellers. Try refreshing the page." : 'No delivered sales yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{product.quantitySold.toLocaleString()}</TableCell>
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
