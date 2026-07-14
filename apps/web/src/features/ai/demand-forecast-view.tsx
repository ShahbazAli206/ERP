'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/shared/chart-card';
import {
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { DemandForecastProduct } from './api';
import { DemoDataBadge } from './demo-data-badge';
import { formatMonthLabel } from './format';
import { useDemandForecast } from './hooks';

/** `--chart-1` … `--chart-8` — the validated categorical palette (see `chart-card.tsx`'s docstring).
 * The engine picks 3-5 products per request, so 8 slots is always enough; cycle defensively anyway. */
const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

function buildChartConfig(products: DemandForecastProduct[]): ChartConfig {
  const config: ChartConfig = {};
  products.forEach((product, index) => {
    config[product.productId] = { label: product.productName, color: CHART_COLORS[index % CHART_COLORS.length] };
  });
  return config;
}

/** One row per month, one column per product (keyed by `productId`) — the shape Recharts needs
 * for a multi-line chart where each `<Line dataKey>` picks a fixed key per row. */
function buildChartData(products: DemandForecastProduct[]) {
  const months = Array.from(new Set(products.flatMap((p) => p.forecast.map((f) => f.month)))).sort();
  return months.map((month) => {
    const row: Record<string, string | number> = { month };
    for (const product of products) {
      const point = product.forecast.find((f) => f.month === month);
      row[product.productId] = point?.predictedDemand ?? 0;
    }
    return row;
  });
}

/**
 * Demo-generated 6-month demand forecast for a sample of 3-5 real products
 * (`aiForecastingEngine.forecastDemand()`, `apps/api/src/shared/integrations/aiForecasting.service.ts`)
 * — randomly generated numbers, not a real prediction. The `<DemoDataBadge />` in the card header
 * makes that explicit rather than letting it read as a live AI feature.
 */
export function DemandForecastView() {
  const query = useDemandForecast();
  const products = query.data ?? [];
  const chartConfig = buildChartConfig(products);
  const chartData = buildChartData(products);

  return (
    <ChartCard
      title="Demand Forecast"
      description="Projected monthly demand for a sample of products over the next 6 months"
      action={<DemoDataBadge />}
      config={chartConfig}
      isLoading={query.isLoading}
      isEmpty={products.length === 0}
      emptyMessage={query.isError ? "Couldn't load the demand forecast. Try refreshing the page." : 'No forecast data yet.'}
    >
      <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickFormatter={formatMonthLabel} />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatMonthLabel(String(value))} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {products.map((product) => (
          <Line
            key={product.productId}
            type="monotone"
            dataKey={product.productId}
            name={product.productName}
            stroke={`var(--color-${product.productId})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartCard>
  );
}
