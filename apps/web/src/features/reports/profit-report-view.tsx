'use client';

import { useState } from 'react';
import { DollarSignIcon, PercentIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { ReportsPageShell } from './reports-nav';
import { ReportToolbar } from './report-toolbar';
import { DateRangeFilter } from './date-range-filter';
import { formatMoney, startOfYear, toDateInputValue } from './format';
import { useProfitReport } from './hooks';

export function ProfitReportView() {
  const [from, setFrom] = useState(() => toDateInputValue(startOfYear()));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));
  const query = useProfitReport({ from, to });

  return (
    <ReportsPageShell title="Profit Report" description="Income, cost of goods sold, expenses and net profit for a date range.">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          <ReportToolbar kind="profit" params={{ from, to }} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Income" value={query.data ? formatMoney(query.data.income) : '—'} icon={TrendingUpIcon} isLoading={query.isLoading} />
          <StatCard title="Cost of goods sold" value={query.data ? formatMoney(query.data.cogs) : '—'} icon={PercentIcon} isLoading={query.isLoading} />
          <StatCard title="Expenses" value={query.data ? formatMoney(query.data.expenses) : '—'} icon={TrendingDownIcon} isLoading={query.isLoading} />
          <StatCard title="Net profit" value={query.data ? formatMoney(query.data.netProfit) : '—'} icon={DollarSignIcon} isLoading={query.isLoading} />
        </div>
      </div>
    </ReportsPageShell>
  );
}
