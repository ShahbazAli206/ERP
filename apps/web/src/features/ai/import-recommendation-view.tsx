'use client';

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DemoDataBadge } from './demo-data-badge';
import { useImportRecommendation } from './hooks';

/**
 * Demo-generated import/reorder recommendations for a sample of real products
 * (`aiForecastingEngine.recommendImports()`) — a random quantity and a canned reason picked from a
 * short fixed list, not a real reorder-point calculation. The `<DemoDataBadge />` makes that
 * explicit rather than letting it read as a live AI recommendation.
 */
export function ImportRecommendationView() {
  const query = useImportRecommendation();
  const recommendations = query.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Recommendation</CardTitle>
        <CardDescription>Suggested reorder quantities for a sample of products</CardDescription>
        <CardAction>
          <DemoDataBadge />
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Recommended Order Qty</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    {query.isError ? "Couldn't load import recommendations. Try refreshing the page." : 'No recommendations yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                recommendations.map((rec, index) => (
                  // No stable id on this DTO (demo data regenerated per request) — index is fine
                  // since the list isn't reordered/filtered client-side.
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rec.productName}</TableCell>
                    <TableCell className="text-right tabular-nums">{rec.recommendedOrderQuantity.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{rec.reason}</TableCell>
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
