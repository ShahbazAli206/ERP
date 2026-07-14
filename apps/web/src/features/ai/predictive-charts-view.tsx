'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/shared/chart-card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { DemoDataBadge } from './demo-data-badge';
import { formatCompactNumber, formatDateLabel } from './format';
import { usePredictiveCharts } from './hooks';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

/**
 * Demo-generated predictive time series (`aiForecastingEngine.predictiveCharts()`) — a smoothed
 * random walk, not a real prediction. The API currently returns two series ("Projected Revenue"
 * in PKR and "Projected Inventory Turnover" as a small ratio) on wildly different scales, so each
 * gets its own single-series chart (a shared axis would flatten the turnover line to near-zero)
 * rather than one combined multi-line chart. Renders generically over however many series come
 * back, in case that changes.
 */
export function PredictiveChartsView() {
  const query = usePredictiveCharts();
  const series = query.data ?? [];
  // At least one placeholder card so the loading skeleton / empty state has somewhere to render;
  // real `series` (once loaded) replaces it entirely.
  const cards = series.length > 0 ? series : [{ label: 'Predictive Charts', points: [] }];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((s, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const chartConfig = { value: { label: s.label, color } } satisfies ChartConfig;
        return (
          <ChartCard
            key={s.label}
            title={s.label}
            description="12-month projected trend"
            action={index === 0 ? <DemoDataBadge /> : undefined}
            config={chartConfig}
            isLoading={query.isLoading}
            isEmpty={!query.isLoading && s.points.length === 0}
            emptyMessage={query.isError ? "Couldn't load predictive charts. Try refreshing the page." : 'No predictive data yet.'}
          >
            <LineChart data={s.points} margin={{ left: 8, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={formatDateLabel} />
              <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatCompactNumber} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={(value) => formatDateLabel(String(value))} />}
              />
              <Line type="monotone" dataKey="value" name={s.label} stroke="var(--color-value)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>
        );
      })}
    </div>
  );
}
