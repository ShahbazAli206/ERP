'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ArrowDownIcon, ArrowUpIcon, ScaleIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { DateRangeFilter } from './date-range-filter';
import { formatMoney, startOfYear, toDateInputValue } from './format';
import { useCashFlowReport } from './hooks';

const chartConfig = {
  incoming: { label: 'Incoming', color: 'var(--chart-1)' },
  outgoing: { label: 'Outgoing', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function CashFlowReportView() {
  const [from, setFrom] = useState(() => toDateInputValue(startOfYear()));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const query = useCashFlowReport({ from, to });

  return (
    <ReportsPageShell title="Cash Flow Report" description="Incoming and outgoing payments for a date range, broken down by day.">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <ReportToolbar kind="cash-flow" params={{ from, to }} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Incoming" value={query.data ? formatMoney(query.data.incoming) : '—'} icon={ArrowUpIcon} isLoading={query.isLoading} />
          <StatCard title="Outgoing" value={query.data ? formatMoney(query.data.outgoing) : '—'} icon={ArrowDownIcon} isLoading={query.isLoading} />
          <StatCard title="Net cash flow" value={query.data ? formatMoney(query.data.netCashFlow) : '—'} icon={ScaleIcon} isLoading={query.isLoading} />
        </div>

        <ChartCard
          title="Daily cash flow"
          config={chartConfig}
          isLoading={query.isLoading}
          isEmpty={!query.data?.byDate.length}
        >
          <BarChart data={query.data?.byDate ?? []}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="incoming" fill="var(--color-incoming)" radius={4} />
            <Bar dataKey="outgoing" fill="var(--color-outgoing)" radius={4} />
          </BarChart>
        </ChartCard>
      </div>
    </ReportsPageShell>
  );
}
