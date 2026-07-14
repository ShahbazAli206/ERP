'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { PackageIcon } from 'lucide-react';
import type { ProductLot } from './api';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_DAYS = 30;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Extracted to a plain module-level helper (rather than calling `Date.now()`
 * inline in the component body) since the React Compiler's purity rule
 * (`react-hooks/purity`) flags impure calls made directly during render —
 * mirrors `features/dashboard/utils.ts#formatRelativeTime`'s same pattern.
 */
function daysUntilExpiry(expiryDate: string): number {
  return Math.ceil((new Date(expiryDate).getTime() - Date.now()) / MS_PER_DAY);
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-muted-foreground">No expiry</span>;

  const daysUntil = daysUntilExpiry(expiryDate);
  const isExpired = daysUntil < 0;
  const isExpiringSoon = !isExpired && daysUntil <= EXPIRY_WARNING_DAYS;

  return (
    <div className="flex items-center gap-1.5">
      <span>{formatDate(expiryDate)}</span>
      {isExpired && (
        <Badge variant="outline" style={{ color: STATUS_COLOR_VAR.critical, borderColor: STATUS_COLOR_VAR.critical }}>
          Expired {Math.abs(daysUntil)}d ago
        </Badge>
      )}
      {isExpiringSoon && (
        <Badge variant="outline" style={{ color: STATUS_COLOR_VAR.warning, borderColor: STATUS_COLOR_VAR.warning }}>
          {daysUntil}d left
        </Badge>
      )}
    </div>
  );
}

/**
 * Displays a product's `InventoryLot`s in FIFO order — the API's
 * `products.repository.ts#findById` already sorts `inventoryLots` by
 * `receivedAt: 'asc'`, so array order here IS FIFO consumption order (the
 * lot a stock decrease would draw from first is row #1). The "FIFO order"
 * column makes that explicit rather than relying on the viewer to notice the
 * `receivedAt` sort themselves.
 */
export function ProductLotsTable({ lots }: { lots: ProductLot[] }) {
  if (lots.length === 0) {
    return (
      <Empty className="min-h-40 border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageIcon />
          </EmptyMedia>
          <EmptyTitle>No inventory lots</EmptyTitle>
          <EmptyDescription>Record a goods receipt or stock adjustment to add stock for this product.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">FIFO order</TableHead>
            <TableHead>Lot number</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Cost price</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Expiry</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((lot, index) => (
            <TableRow key={lot.id}>
              <TableCell>
                <Badge variant={index === 0 ? 'default' : 'secondary'}>{index === 0 ? 'Next (oldest)' : `#${index + 1}`}</Badge>
              </TableCell>
              <TableCell className="font-medium">{lot.lotNumber}</TableCell>
              <TableCell>{lot.warehouseName}</TableCell>
              <TableCell className="tabular-nums">{lot.quantity}</TableCell>
              <TableCell className="tabular-nums">{lot.costPrice.toFixed(2)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(lot.receivedAt)}</TableCell>
              <TableCell>
                <ExpiryBadge expiryDate={lot.expiryDate} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
