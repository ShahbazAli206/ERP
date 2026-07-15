'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { ChartCard } from '@/components/shared/chart-card';
import { StatCard } from '@/components/shared/stat-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { WalletIcon } from 'lucide-react';
import { ExpensesSubNav } from './expenses-nav';
import { useExpenseReport } from '../hooks';
import { formatMoney, toLocalDateInputValue } from '../format';

/** First day of the current month, as `YYYY-MM-DD` (local calendar, not UTC — see `toLocalDateInputValue`). */
function startOfMonth(): string {
  const now = new Date();
  return toLocalDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
}

/** Today, as `YYYY-MM-DD` (local calendar, not UTC). */
function today(): string {
  return toLocalDateInputValue(new Date());
}

const reportChartConfig = { total: { label: 'Total spent', color: 'var(--chart-1)' } } satisfies ChartConfig;

function categoryBarChart(data: Array<{ categoryName: string; total: number }>) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
      <CartesianGrid horizontal={false} />
      <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: number) => formatMoney(v)} />
      <YAxis
        type="category"
        dataKey="categoryName"
        tickLine={false}
        axisLine={false}
        width={120}
        interval={0}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            hideLabel
            hideIndicator
            formatter={(value, _name, item) => (
              <div className="flex w-full items-center justify-between gap-4">
                <span className="text-muted-foreground">{String(item.payload.categoryName)}</span>
                <span className="font-mono font-medium tabular-nums">{formatMoney(Number(value))}</span>
              </div>
            )}
          />
        }
      />
      <Bar dataKey="total" fill="var(--color-total)" radius={4} barSize={18} />
    </BarChart>
  );
}

export function ExpenseReportView() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(today());

  const reportQuery = useExpenseReport(from, to);
  const items = reportQuery.data?.items ?? [];
  const grandTotal = reportQuery.data?.grandTotal ?? 0;
  const sortedItems = [...items].sort((a, b) => b.total - a.total);

  return (
    <>
      <PageHeader title="Expense Report" description="Totals grouped by category for a date range." />
      <ExpensesSubNav />

      <div className="mt-6 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="w-[160px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="report-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="w-[160px]" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Grand Total"
          value={formatMoney(grandTotal)}
          icon={WalletIcon}
          description={`${from} to ${to}`}
          isLoading={reportQuery.isLoading}
          className="sm:col-span-1"
        />
        <ChartCard
          title="Spend by Category"
          description="Total expense amount per category for the selected range"
          config={reportChartConfig}
          isLoading={reportQuery.isLoading}
          isEmpty={reportQuery.isError || sortedItems.length === 0}
          emptyMessage={reportQuery.isError ? "Couldn't load the report. Try refreshing the page." : 'No expenses recorded in this range.'}
          className="sm:col-span-2"
        >
          {categoryBarChart(sortedItems)}
        </ChartCard>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">% of Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  {reportQuery.isLoading ? 'Loading…' : 'No expenses recorded in this range.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => (
                <TableRow key={item.categoryId}>
                  <TableCell className="font-medium">{item.categoryName}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(item.total)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {grandTotal > 0 ? `${((item.total / grandTotal) * 100).toFixed(1)}%` : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {sortedItems.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Grand Total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatMoney(grandTotal)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">100%</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </>
  );
}
