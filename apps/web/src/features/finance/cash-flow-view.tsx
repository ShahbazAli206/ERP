'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ArrowDownLeftIcon, ArrowUpRightIcon, TrendingUpIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { FinancePageShell, ReportsSubNav } from './finance-nav';
import { DateRangeFilter } from './date-range-filter';
import { formatCompact, formatMoney, toDateInputValue } from './format';
import { useCashFlow } from './hooks';

function daysAgo(days: number): Date {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return now;
}

const chartConfig = {
  incoming: { label: 'Incoming', color: 'var(--chart-1)' },
  outgoing: { label: 'Outgoing', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function CashFlowView() {
  const [from, setFrom] = useState(() => toDateInputValue(daysAgo(60)));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));

  const query = useCashFlow({ from, to });

  return (
    <FinancePageShell title="Cash Flow" description="Incoming and outgoing payment totals for a date range, with a day-by-day breakdown.">
      <div className="space-y-4">
        <ReportsSubNav />

        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Incoming"
            value={query.data ? formatMoney(query.data.incoming) : '—'}
            icon={ArrowDownLeftIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Outgoing"
            value={query.data ? formatMoney(query.data.outgoing) : '—'}
            icon={ArrowUpRightIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Net cash flow"
            value={query.data ? formatMoney(query.data.netCashFlow) : '—'}
            icon={TrendingUpIcon}
            isLoading={query.isLoading}
          />
        </div>

        <ChartCard
          title="Cash flow by day"
          description="Incoming vs. outgoing payments for each day with activity in the selected range"
          config={chartConfig}
          isLoading={query.isLoading}
          isEmpty={(query.data?.byDate.length ?? 0) === 0}
        >
          <BarChart data={query.data?.byDate ?? []} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={formatCompact} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value))} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="incoming" fill="var(--color-incoming)" radius={4} />
            <Bar dataKey="outgoing" fill="var(--color-outgoing)" radius={4} />
          </BarChart>
        </ChartCard>
      </div>
    </FinancePageShell>
  );
}
