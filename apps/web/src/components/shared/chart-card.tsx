import { BarChart3 } from 'lucide-react';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Card wrapper around shadcn's Recharts `ChartContainer`, with built-in
 * loading/empty states and consistent sizing. This is the standard way
 * every module should render a chart — don't reach for `ChartContainer`
 * directly in a module page.
 *
 * ── Colors ────────────────────────────────────────────────────────────
 * The base theme (`base-nova`/neutral) is intentionally grayscale for UI
 * chrome, but chart series need to be distinguishable, so `--chart-1`
 * through `--chart-8` in `globals.css` are a validated categorical palette
 * (colorblind-safe adjacent-pair separation, WCAG-checked against both chart
 * surfaces) — NOT the shadcn-generated grayscale defaults. Reference them by
 * variable in your `ChartConfig`, never hardcode a hex:
 *
 *   const chartConfig = {
 *     revenue: { label: 'Revenue', color: 'var(--chart-1)' },
 *     expenses: { label: 'Expenses', color: 'var(--chart-2)' },
 *   } satisfies ChartConfig;
 *
 * Some palette slots (aqua/yellow/magenta in light mode) dip below 3:1
 * contrast by design — always pair color with a legend and/or direct labels,
 * never rely on color alone to distinguish series. Always render
 * `<ChartLegend content={<ChartLegendContent />} />` for 2+ series.
 *
 * ── Usage ───────────────────────────────────────────────────────────────
 *
 *   <ChartCard title="Revenue by month" config={chartConfig} isLoading={query.isLoading} isEmpty={!query.data?.length}>
 *     <BarChart data={query.data}>
 *       <CartesianGrid vertical={false} />
 *       <XAxis dataKey="month" tickLine={false} axisLine={false} />
 *       <ChartTooltip content={<ChartTooltipContent />} />
 *       <ChartLegend content={<ChartLegendContent />} />
 *       <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
 *     </BarChart>
 *   </ChartCard>
 * ─────────────────────────────────────────────────────────────────────────
 */
export function ChartCard({
  title,
  description,
  action,
  config,
  isLoading,
  isEmpty,
  emptyMessage = 'No data to display yet.',
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  config: ChartConfig;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: React.ReactElement;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="aspect-video w-full" />
        ) : isEmpty ? (
          <Empty className={cn('aspect-video border-0 p-0')}>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3 />
              </EmptyMedia>
              <EmptyTitle>No data yet</EmptyTitle>
              <EmptyDescription>{emptyMessage}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer config={config} className="w-full">
            {children}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
