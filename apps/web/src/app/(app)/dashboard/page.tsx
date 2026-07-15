'use client';

import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  Building2Icon,
  BoxesIcon,
  ClipboardListIcon,
  DollarSignIcon,
  PiggyBankIcon,
  StoreIcon,
  TrendingUpIcon,
  TrophyIcon,
  TruckIcon,
  WalletIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { Carousel } from '@/components/shared/carousel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import type { DashboardKpis } from '@/features/dashboard/api';
import {
  useDashboardKpis,
  useDistributorPerformance,
  useInventoryValueByCategory,
  useProfitTrend,
  useRecentActivities,
  useRevenueTrend,
  useSalesByCategory,
  useTopProducts,
  useTopSuppliers,
} from '@/features/dashboard/hooks';
import {
  activityTitle,
  formatCurrencyCompact,
  formatMonthLabel,
  formatRelativeTime,
  formatStatusLabel,
  statusTone,
  truncateLabel,
} from '@/features/dashboard/utils';

/** A ranked entry once normalized to the common `{ name, value }` shape every horizontal bar chart below consumes. */
interface RankedEntry {
  name: string;
  value: number;
}

interface KpiTile {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  description: string;
}

function buildKpiTiles(kpis: DashboardKpis | undefined): KpiTile[] {
  const v = (n: number | undefined) => (n === undefined ? '—' : formatCurrencyCompact(n));
  return [
    { title: 'Total Revenue', value: v(kpis?.totalRevenue), icon: DollarSignIcon, description: 'Trailing 12 months' },
    { title: 'Net Profit', value: v(kpis?.netProfit), icon: TrendingUpIcon, description: 'Trailing 12 months' },
    { title: 'Gross Profit', value: v(kpis?.grossProfit), icon: PiggyBankIcon, description: 'Trailing 12 months' },
    { title: 'Cash Position', value: v(kpis?.cashPosition), icon: WalletIcon, description: 'Current balance' },
    { title: 'Inventory Value', value: v(kpis?.inventoryValue), icon: BoxesIcon, description: 'Current valuation' },
    {
      title: 'Outstanding Receivables',
      value: v(kpis?.outstandingReceivables),
      icon: ArrowDownToLineIcon,
      description: 'Owed by distributors',
    },
    {
      title: 'Outstanding Payables',
      value: v(kpis?.outstandingPayables),
      icon: ArrowUpFromLineIcon,
      description: 'Owed to suppliers',
    },
    {
      title: 'Low Stock Items',
      value: kpis?.lowStockCount ?? '—',
      icon: AlertTriangleIcon,
      description: 'Below reorder threshold',
    },
    {
      title: 'Shipments In Transit',
      value: kpis?.shipmentsInTransitCount ?? '—',
      icon: TruckIcon,
      description: 'Currently in transit',
    },
    {
      title: 'Pending Purchase Orders',
      value: kpis?.pendingPurchaseOrdersCount ?? '—',
      icon: ClipboardListIcon,
      description: 'Awaiting approval or placement',
    },
  ];
}

const revenueTrendConfig = { revenue: { label: 'Revenue', color: 'var(--chart-1)' } } satisfies ChartConfig;
const profitTrendConfig = { profit: { label: 'Net profit', color: 'var(--chart-2)' } } satisfies ChartConfig;

function revenueLineChart(data: Array<{ month: string; revenue: number }>) {
  return (
    <LineChart data={data} margin={{ left: 8, right: 12, top: 8 }}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatMonthLabel} />
      <YAxis tickLine={false} axisLine={false} tickMargin={8} width={68} tickFormatter={(v: number) => formatCurrencyCompact(v)} />
      <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatMonthLabel(String(value))} />} />
      <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-revenue)' }} activeDot={{ r: 5 }} />
    </LineChart>
  );
}

function profitLineChart(data: Array<{ month: string; profit: number }>) {
  return (
    <LineChart data={data} margin={{ left: 8, right: 12, top: 8 }}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatMonthLabel} />
      <YAxis tickLine={false} axisLine={false} tickMargin={8} width={68} tickFormatter={(v: number) => formatCurrencyCompact(v)} />
      <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
      <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatMonthLabel(String(value))} />} />
      <Line dataKey="profit" type="monotone" stroke="var(--color-profit)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-profit)' }} activeDot={{ r: 5 }} />
    </LineChart>
  );
}

/**
 * Every "ranked list" section (category breakdowns + top products/suppliers/distributors) reads
 * best as a horizontal bar chart: the reader's job is comparing magnitude across a handful of
 * named entities, and the category/entity name is already the direct label on the axis, so a
 * single hue (not a per-bar categorical color) is the correct color job here — see
 * `references/choosing-a-form.md`'s "compare magnitude" row in the dataviz skill.
 */
function rankedBarChart(data: RankedEntry[], valueFormatter: (value: number) => string) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
      <CartesianGrid horizontal={false} />
      <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={valueFormatter} />
      <YAxis
        type="category"
        dataKey="name"
        tickLine={false}
        axisLine={false}
        width={112}
        interval={0}
        tickFormatter={(value: string) => truncateLabel(value)}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            hideLabel
            hideIndicator
            formatter={(value, _name, item) => (
              <div className="flex w-full items-center justify-between gap-4">
                <span className="text-muted-foreground">{String(item.payload.name)}</span>
                <span className="font-mono font-medium tabular-nums">{valueFormatter(Number(value))}</span>
              </div>
            )}
          />
        }
      />
      <Bar dataKey="value" fill="var(--color-value)" radius={4} barSize={16} />
    </BarChart>
  );
}

function rankedConfig(label: string): ChartConfig {
  return { value: { label, color: 'var(--chart-1)' } };
}

const unitsFormatter = (v: number) => `${v.toLocaleString()} units`;

/** One slide of the Dashboard's "Highlights" carousel — a colorful spotlight callout, not a data-comparison chart. */
function SpotlightCard({
  icon: Icon,
  label,
  value,
  subtitle,
  gradient,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div
      className="hover-lift flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl p-5 text-white shadow-md"
      style={{ backgroundImage: gradient }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-white/80 uppercase">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-white/15">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="truncate text-xl font-semibold">{value}</p>
        <p className="truncate text-xs text-white/75">{subtitle}</p>
      </div>
    </div>
  );
}

/** Fixed (non-index) keys for the recent-activities loading skeleton rows. */
const SKELETON_ROW_IDS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export default function DashboardPage() {
  const kpisQuery = useDashboardKpis();
  const revenueTrendQuery = useRevenueTrend();
  const profitTrendQuery = useProfitTrend();
  const inventoryValueQuery = useInventoryValueByCategory();
  const salesByCategoryQuery = useSalesByCategory();
  const topProductsQuery = useTopProducts();
  const topSuppliersQuery = useTopSuppliers();
  const distributorPerformanceQuery = useDistributorPerformance();
  const recentActivitiesQuery = useRecentActivities();

  const kpiTiles = buildKpiTiles(kpisQuery.data);

  const inventoryValueData: RankedEntry[] = (inventoryValueQuery.data ?? []).map((d) => ({
    name: d.categoryName,
    value: d.total,
  }));
  const salesByCategoryData: RankedEntry[] = (salesByCategoryQuery.data ?? []).map((d) => ({
    name: d.categoryName,
    value: d.total,
  }));
  const topProductsData: RankedEntry[] = (topProductsQuery.data ?? []).map((d) => ({
    name: d.name,
    value: d.quantitySold,
  }));
  const topSuppliersData: RankedEntry[] = (topSuppliersQuery.data ?? []).map((d) => ({
    name: d.name,
    value: d.totalValue,
  }));
  const distributorData: RankedEntry[] = (distributorPerformanceQuery.data ?? []).map((d) => ({
    name: d.name,
    value: d.totalValue,
  }));

  const emptyMessageFor = (isError: boolean) =>
    isError ? "Couldn't load this chart. Try refreshing the page." : 'No data to display yet.';

  const highlightSlides = [
    kpisQuery.data && {
      icon: TrendingUpIcon,
      label: 'Net Profit',
      value: formatCurrencyCompact(kpisQuery.data.netProfit),
      subtitle: 'Trailing 12 months',
      gradient: 'linear-gradient(135deg, var(--icon-a), var(--icon-f))',
    },
    topProductsData[0] && {
      icon: TrophyIcon,
      label: 'Top Product',
      value: topProductsData[0].name,
      subtitle: unitsFormatter(topProductsData[0].value),
      gradient: 'linear-gradient(135deg, var(--icon-b), var(--icon-c))',
    },
    topSuppliersData[0] && {
      icon: StoreIcon,
      label: 'Top Supplier',
      value: topSuppliersData[0].name,
      subtitle: `${formatCurrencyCompact(topSuppliersData[0].value)} committed`,
      gradient: 'linear-gradient(135deg, var(--icon-e), var(--icon-a))',
    },
    distributorData[0] && {
      icon: Building2Icon,
      label: 'Top Distributor',
      value: distributorData[0].name,
      subtitle: `${formatCurrencyCompact(distributorData[0].value)} committed`,
      gradient: 'linear-gradient(135deg, var(--icon-d), var(--icon-b))',
    },
  ].filter((slide): slide is NonNullable<typeof slide> => Boolean(slide));

  return (
    <>
      <PageHeader title="Dashboard" description="Executive KPIs and cross-module charts at a glance." />

      {highlightSlides.length > 0 && (
        <Carousel slides={highlightSlides.map((slide, i) => <SpotlightCard key={i} {...slide} />)} />
      )}

      {kpisQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Couldn&apos;t load KPI summary</AlertTitle>
          <AlertDescription>{kpisQuery.error instanceof Error ? kpisQuery.error.message : 'Please try refreshing the page.'}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpiTiles.map((tile) => (
          <StatCard
            key={tile.title}
            title={tile.title}
            value={tile.value}
            icon={tile.icon}
            description={tile.description}
            isLoading={kpisQuery.isLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Revenue Trend"
          description="Trailing 12 months of total revenue"
          config={revenueTrendConfig}
          isLoading={revenueTrendQuery.isLoading}
          isEmpty={revenueTrendQuery.isError || !revenueTrendQuery.data?.length}
          emptyMessage={emptyMessageFor(revenueTrendQuery.isError)}
        >
          {revenueLineChart(revenueTrendQuery.data ?? [])}
        </ChartCard>

        <ChartCard
          title="Profit Trend"
          description="Trailing 12 months of net profit"
          config={profitTrendConfig}
          isLoading={profitTrendQuery.isLoading}
          isEmpty={profitTrendQuery.isError || !profitTrendQuery.data?.length}
          emptyMessage={emptyMessageFor(profitTrendQuery.isError)}
        >
          {profitLineChart(profitTrendQuery.data ?? [])}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Inventory Value by Category"
          description="Current stock valuation, ranked by category"
          config={rankedConfig('Inventory value')}
          isLoading={inventoryValueQuery.isLoading}
          isEmpty={inventoryValueQuery.isError || inventoryValueData.length === 0}
          emptyMessage={emptyMessageFor(inventoryValueQuery.isError)}
        >
          {rankedBarChart(inventoryValueData, formatCurrencyCompact)}
        </ChartCard>

        <ChartCard
          title="Sales by Category"
          description="Trailing 12 months of sales revenue, ranked by category"
          config={rankedConfig('Sales revenue')}
          isLoading={salesByCategoryQuery.isLoading}
          isEmpty={salesByCategoryQuery.isError || salesByCategoryData.length === 0}
          emptyMessage={emptyMessageFor(salesByCategoryQuery.isError)}
        >
          {rankedBarChart(salesByCategoryData, formatCurrencyCompact)}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Top Products"
          description="Best-selling products by quantity"
          config={rankedConfig('Units sold')}
          isLoading={topProductsQuery.isLoading}
          isEmpty={topProductsQuery.isError || topProductsData.length === 0}
          emptyMessage={emptyMessageFor(topProductsQuery.isError)}
        >
          {rankedBarChart(topProductsData, unitsFormatter)}
        </ChartCard>

        <ChartCard
          title="Top Suppliers"
          description="By total committed purchase value"
          config={rankedConfig('Committed value')}
          isLoading={topSuppliersQuery.isLoading}
          isEmpty={topSuppliersQuery.isError || topSuppliersData.length === 0}
          emptyMessage={emptyMessageFor(topSuppliersQuery.isError)}
        >
          {rankedBarChart(topSuppliersData, formatCurrencyCompact)}
        </ChartCard>

        <ChartCard
          title="Distributor Performance"
          description="By total committed sales value"
          config={rankedConfig('Committed sales')}
          isLoading={distributorPerformanceQuery.isLoading}
          isEmpty={distributorPerformanceQuery.isError || distributorData.length === 0}
          emptyMessage={emptyMessageFor(distributorPerformanceQuery.isError)}
        >
          {rankedBarChart(distributorData, formatCurrencyCompact)}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest status changes across purchase orders, shipments, and sales orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivitiesQuery.isLoading ? (
            <div className="space-y-3">
              {SKELETON_ROW_IDS.map((id) => (
                <Skeleton key={id} className="h-12 w-full" />
              ))}
            </div>
          ) : recentActivitiesQuery.isError || !recentActivitiesQuery.data?.length ? (
            <Empty className="border-0 p-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ActivityIcon />
                </EmptyMedia>
                <EmptyTitle>{recentActivitiesQuery.isError ? "Couldn't load recent activity" : 'No recent activity'}</EmptyTitle>
                <EmptyDescription>
                  {recentActivitiesQuery.isError
                    ? 'Try refreshing the page.'
                    : 'Status changes will appear here as orders, shipments, and sales move forward.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivitiesQuery.data.map((activity) => {
                const tone = statusTone(activity.status);
                return (
                  <li key={activity.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-medium">{activityTitle(activity.entityType, activity.referenceLabel)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activity.changedByName ?? 'System'} · {formatRelativeTime(activity.changedAt)}
                        {activity.note ? ` · ${activity.note}` : ''}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0"
                      style={tone ? { color: STATUS_COLOR_VAR[tone], borderColor: STATUS_COLOR_VAR[tone] } : undefined}
                    >
                      {formatStatusLabel(activity.status)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
