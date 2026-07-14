'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/shared/chart-card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { DemoDataBadge } from './demo-data-badge';
import { useSeasonalAnalysis } from './hooks';

const chartConfig = {
  seasonalIndex: { label: 'Seasonal index', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/**
 * Seasonal index is a single-series magnitude comparison across the 12 calendar months — per the
 * dataviz form heuristic (see `valuation-view.tsx`'s docstring for the same reasoning) that's a
 * bar chart with one consistent hue, not a distinct color per bar: the x-axis already identifies
 * each month by name, so per-bar color would be redundant identity-encoding.
 *
 * Demo-generated (`aiForecastingEngine.seasonalAnalysis()`) — a random value per month, not a real
 * seasonality computation. The `<DemoDataBadge />` makes that explicit.
 */
export function SeasonalAnalysisView() {
  const query = useSeasonalAnalysis();
  const data = query.data ?? [];

  return (
    <ChartCard
      title="Seasonal Analysis"
      description="Relative demand index by calendar month (1.0 = average month)"
      action={<DemoDataBadge />}
      config={chartConfig}
      isLoading={query.isLoading}
      isEmpty={data.length === 0}
      emptyMessage={query.isError ? "Couldn't load seasonal analysis. Try refreshing the page." : 'No seasonal data yet.'}
    >
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickFormatter={(value: string) => value.slice(0, 3)} />
        <YAxis tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="seasonalIndex" fill="var(--color-seasonalIndex)" radius={4} />
      </BarChart>
    </ChartCard>
  );
}
