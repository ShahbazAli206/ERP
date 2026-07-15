import type { LucideIcon } from 'lucide-react';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';

/** Cosmetic icon-badge accents — see the `--icon-*` vars in globals.css. Cycled by position, not by meaning. */
const ICON_ACCENTS = ['var(--icon-a)', 'var(--icon-b)', 'var(--icon-c)', 'var(--icon-d)', 'var(--icon-e)', 'var(--icon-f)'];

/** Deterministic small int from a string, so cards get a stable accent/stagger from their title alone — no caller changes needed at any of this component's 20+ call sites. */
function hashIndex(title: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  return Math.abs(hash) % mod;
}

export interface StatCardTrend {
  /** Signed percent change, e.g. 12.5 or -4.2. Sign decides the up/down icon and good/critical color. */
  value: number;
  /** e.g. "vs last month". */
  label?: string;
}

/**
 * KPI/stat tile — the standard way to show a single headline number (e.g.
 * Dashboard's "Total Revenue", Inventory's "Low Stock Items"). Not a chart:
 * per the dataviz form heuristic, a single number's job is "headline", not
 * magnitude-comparison, so it's a stat tile, not a 1-bar bar chart.
 *
 *   <StatCard title="Total Revenue" value={formatCurrency(total)} icon={DollarSign}
 *     trend={{ value: 12.5, label: 'vs last month' }} isLoading={query.isLoading} />
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isLoading,
  className,
  index,
}: {
  title: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  description?: string;
  trend?: StatCardTrend;
  isLoading?: boolean;
  className?: string;
  /** Optional explicit position within its grid (overrides the title-based default) for the icon-badge accent color and entrance stagger. */
  index?: number;
}) {
  const accent = ICON_ACCENTS[(index ?? hashIndex(title, ICON_ACCENTS.length)) % ICON_ACCENTS.length];
  const delaySteps = index ?? hashIndex(title, 8);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend !== undefined && trend.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delaySteps * 0.04, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={className}>
        <CardHeader>
          <CardDescription>{title}</CardDescription>
          {Icon && (
            <CardAction>
              <span
                className="flex size-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in oklch, ${accent}, transparent 82%)`, color: accent }}
              >
                <Icon className="size-4" />
              </span>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-1">
          <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
          {trend && (
            <div
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: STATUS_COLOR_VAR[isPositive ? 'good' : 'critical'] }}
            >
              {isPositive ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="font-normal text-muted-foreground">{trend.label}</span>}
            </div>
          )}
          {description && !trend && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
