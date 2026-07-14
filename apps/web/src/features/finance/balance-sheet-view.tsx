'use client';

import { BoxesIcon, LandmarkIcon, ScaleIcon } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FinancePageShell, ReportsSubNav } from './finance-nav';
import { formatMoney } from './format';
import { useBalanceSheet } from './hooks';

export function BalanceSheetView() {
  const query = useBalanceSheet();

  return (
    <FinancePageShell title="Balance Sheet" description="Assets, liabilities, and equity as of now.">
      <div className="space-y-4">
        <ReportsSubNav />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Assets"
            value={query.data ? formatMoney(query.data.assets) : '—'}
            icon={BoxesIcon}
            description="Cash + inventory valuation + receivables"
            isLoading={query.isLoading}
          />
          <StatCard
            title="Liabilities"
            value={query.data ? formatMoney(query.data.liabilities) : '—'}
            icon={LandmarkIcon}
            description="Outstanding payables to suppliers"
            isLoading={query.isLoading}
          />
          <StatCard
            title="Equity"
            value={query.data ? formatMoney(query.data.equity) : '—'}
            icon={ScaleIcon}
            description="Assets minus liabilities"
            isLoading={query.isLoading}
          />
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm">The accounting identity</CardTitle>
            <CardDescription>Assets = Liabilities + Equity always holds, by construction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assets</span>
              <span className="tabular-nums">{query.data ? formatMoney(query.data.assets) : '—'}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Liabilities + Equity</span>
              <span className="tabular-nums">
                {query.data ? formatMoney(query.data.liabilities + query.data.equity) : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinancePageShell>
  );
}
