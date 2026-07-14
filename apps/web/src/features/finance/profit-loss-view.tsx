'use client';

import { useState } from 'react';
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, PercentIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FinancePageShell, ReportsSubNav } from './finance-nav';
import { DateRangeFilter } from './date-range-filter';
import { formatMoney, toDateInputValue } from './format';
import { useProfitLoss } from './hooks';

function startOfYear(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
}

export function ProfitLossView() {
  const [from, setFrom] = useState(() => toDateInputValue(startOfYear()));
  const [to, setTo] = useState(() => toDateInputValue(new Date()));

  const query = useProfitLoss({ from, to });

  return (
    <FinancePageShell title="Profit & Loss" description="Income, cost of goods sold, expenses, and net profit for a date range.">
      <div className="space-y-4">
        <ReportsSubNav />

        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Income"
            value={query.data ? formatMoney(query.data.income) : '—'}
            icon={TrendingUpIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Cost of goods sold"
            value={query.data ? formatMoney(query.data.cogs) : '—'}
            icon={PercentIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Expenses"
            value={query.data ? formatMoney(query.data.expenses) : '—'}
            icon={TrendingDownIcon}
            isLoading={query.isLoading}
          />
          <StatCard
            title="Net profit"
            value={query.data ? formatMoney(query.data.netProfit) : '—'}
            icon={DollarSignIcon}
            isLoading={query.isLoading}
          />
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm">How this is calculated</CardTitle>
            <CardDescription>Income minus cost of goods sold minus expenses, for the selected date range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Income</span>
              <span className="tabular-nums">{query.data ? formatMoney(query.data.income) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">− Cost of goods sold</span>
              <span className="tabular-nums">{query.data ? formatMoney(query.data.cogs) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">− Expenses</span>
              <span className="tabular-nums">{query.data ? formatMoney(query.data.expenses) : '—'}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2 font-medium">
              <span>= Net profit</span>
              <span className="tabular-nums">{query.data ? formatMoney(query.data.netProfit) : '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancePageShell>
  );
}
