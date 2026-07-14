import { SparklesIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Marks a section as demo-generated, not real AI/ML output — per the spec
 * (`project_description.txt`, Module 13) this module is explicitly "demo only, do NOT integrate
 * real AI." Used on Demand Forecast, Seasonal Analysis, Import Recommendation, and Predictive
 * Charts (all backed by `aiForecasting.service.ts`'s randomized generator). Deliberately NOT used
 * on Best Selling Products or Slow Moving Inventory, which are real aggregations over
 * sales/inventory data (`ai.service.ts`) — see those views' own docstrings.
 */
export function DemoDataBadge() {
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <SparklesIcon className="size-3" />
      Demo data — not real AI
    </Badge>
  );
}
