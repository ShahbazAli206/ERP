import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LandedCostSummary } from './api';

function formatMoney(value: number, currency?: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: currency ? 'currency' : 'decimal',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

/**
 * Landed-cost breakdown: the shipment-level freight/insurance/duty/customs
 * inputs (in the shipment's own currency) plus their base-currency total,
 * and — per item — the base unit cost from the linked PO (if any) alongside
 * the proportionally allocated landed cost and resulting landed unit cost.
 * The allocation math itself (PO-value-weighted when linked, even-by-quantity
 * otherwise) happens server-side in `shipments.service.ts`'s
 * `buildLandedCostSummary` — this component only renders the result.
 */
export function LandedCostSummaryView({ summary }: { summary: LandedCostSummary }) {
  const totalUnits = summary.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Freight" value={formatMoney(summary.freightCost, summary.currency)} />
        <SummaryStat label="Insurance" value={formatMoney(summary.insuranceCost, summary.currency)} />
        <SummaryStat label="Duty" value={formatMoney(summary.dutyCost, summary.currency)} />
        <SummaryStat label="Customs" value={formatMoney(summary.customsCharges, summary.currency)} />
      </div>
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <span className="text-muted-foreground">Total additional cost (base currency, @ </span>
        <span className="font-medium">{summary.exchangeRateToBase}</span>
        <span className="text-muted-foreground"> {summary.currency}/base): </span>
        <span className="font-semibold">{formatMoney(summary.totalAdditionalCostBase)}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">PO unit cost</TableHead>
              <TableHead className="text-right">Allocated landed cost (base)</TableHead>
              <TableHead className="text-right">Landed unit cost (base)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.items.map((item) => (
              <TableRow key={item.productId}>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {item.poUnitCost === null ? <span className="text-muted-foreground">—</span> : formatMoney(item.poUnitCost)}
                </TableCell>
                <TableCell className="text-right">{formatMoney(item.allocatedLandedCostBase)}</TableCell>
                <TableCell className="text-right font-medium">{formatMoney(item.landedUnitCostBase)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {totalUnits} unit{totalUnits === 1 ? '' : 's'} across {summary.items.length} product
        {summary.items.length === 1 ? '' : 's'}. Allocation is weighted by PO line value when a product matches the
        linked purchase order, or evenly by quantity otherwise.
      </p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
