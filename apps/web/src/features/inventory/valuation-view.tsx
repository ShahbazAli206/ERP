'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { DollarSignIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useAllProducts, useValuation } from './hooks';

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Compact axis tick (e.g. "500M") — plain `toLocaleString()` 9-digit values clipped against the Y-axis's fixed width. */
function formatCompact(value: number) {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

const chartConfig = {
  total: { label: 'Valuation', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Category breakdown is a single-series magnitude comparison across ~8
 * categories — per the dataviz form heuristic that's a bar chart with one
 * consistent hue (not a distinct color per bar): the x-axis already
 * identifies each category by name, so per-bar color would be redundant
 * identity-encoding, and with only one series there's no legend to key
 * against. See `chart-card.tsx`'s docstring for the palette rationale.
 */
export function ValuationView() {
  const valuationQuery = useValuation();
  const productsQuery = useAllProducts();

  const categoryTotals = new Map<string, number>();
  if (valuationQuery.data && productsQuery.data) {
    const categoryByProduct = new Map(productsQuery.data.data.map((p) => [p.id, p.categoryName ?? 'Uncategorized']));
    for (const line of valuationQuery.data.lines) {
      const category = categoryByProduct.get(line.productId) ?? 'Uncategorized';
      categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + line.valuationTotal);
    }
  }
  const chartData = Array.from(categoryTotals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const sortedLines = [...(valuationQuery.data?.lines ?? [])].sort((a, b) => b.valuationTotal - a.valuationTotal);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total inventory value"
          value={valuationQuery.data ? formatMoney(valuationQuery.data.grandTotal) : '—'}
          icon={DollarSignIcon}
          description="Sum of quantity × cost price across all lots"
          isLoading={valuationQuery.isLoading}
          className="sm:col-span-1"
        />
        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">How this is calculated</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Each product&apos;s valuation is the sum of <span className="font-medium text-foreground">quantity × cost price</span> across
            every inventory lot it currently has on hand, in every warehouse. The grand total is the sum across all products.
          </CardContent>
        </Card>
      </div>

      <ChartCard
        title="Valuation by category"
        description="Total inventory value grouped by product category"
        config={chartConfig}
        isLoading={valuationQuery.isLoading || productsQuery.isLoading}
        isEmpty={chartData.length === 0}
      >
        <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="category" tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatCompact} />
          <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={4} />
        </BarChart>
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Valuation by product</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity on hand</TableHead>
                  <TableHead>Valuation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valuationQuery.isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No inventory on hand to value yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLines.map((line) => (
                    <TableRow key={line.productId}>
                      <TableCell className="font-medium">{line.sku}</TableCell>
                      <TableCell>{line.name}</TableCell>
                      <TableCell className="tabular-nums">{line.quantity}</TableCell>
                      <TableCell className="tabular-nums">{formatMoney(line.valuationTotal)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
