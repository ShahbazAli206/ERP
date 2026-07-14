'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangleIcon, CalendarClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_COLOR_VAR } from '@/lib/status-colors';
import { useExpiryAlerts, useLowStockAlerts } from './hooks';

const WITHIN_DAYS_OPTIONS = [7, 14, 30, 60, 90];

function LowStockAlertsTab() {
  const query = useLowStockAlerts();

  if (query.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!query.data?.length) {
    return (
      <Empty className="min-h-56 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangleIcon />
          </EmptyMedia>
          <EmptyTitle>No low-stock products</EmptyTitle>
          <EmptyDescription>Every active product is currently above its reorder level.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Stock on hand</TableHead>
            <TableHead>Reorder level</TableHead>
            <TableHead>Shortfall</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.data.map((alert) => (
            <TableRow key={alert.productId}>
              <TableCell>
                <Link href={`/inventory/products/${alert.productId}`} className="font-medium hover:underline">
                  {alert.sku}
                </Link>
              </TableCell>
              <TableCell>{alert.name}</TableCell>
              <TableCell className="tabular-nums">{alert.stockOnHand}</TableCell>
              <TableCell className="tabular-nums text-muted-foreground">{alert.reorderLevel}</TableCell>
              <TableCell>
                <Badge variant="outline" style={{ color: STATUS_COLOR_VAR.warning, borderColor: STATUS_COLOR_VAR.warning }}>
                  −{alert.reorderLevel - alert.stockOnHand}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpiryAlertsTab() {
  const [withinDays, setWithinDays] = useState(30);
  const query = useExpiryAlerts(withinDays);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Expiring within</span>
        <Select
          items={Object.fromEntries(WITHIN_DAYS_OPTIONS.map((days) => [String(days), `${days}d`]))}
          value={String(withinDays)}
          onValueChange={(value) => setWithinDays(Number(value ?? 30))}
        >
          <SelectTrigger size="sm" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WITHIN_DAYS_OPTIONS.map((days) => (
              <SelectItem key={days} value={String(days)}>
                {days}d
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !query.data?.length ? (
        <Empty className="min-h-56 border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClockIcon />
            </EmptyMedia>
            <EmptyTitle>No lots expiring soon</EmptyTitle>
            <EmptyDescription>No inventory lot expires within {withinDays} days.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((alert) => (
                <TableRow key={alert.lotId}>
                  <TableCell>
                    <Link href={`/inventory/products/${alert.productId}`} className="font-medium hover:underline">
                      {alert.sku}
                    </Link>
                  </TableCell>
                  <TableCell>{alert.productName}</TableCell>
                  <TableCell>{alert.warehouseName}</TableCell>
                  <TableCell>{alert.lotNumber}</TableCell>
                  <TableCell className="tabular-nums">{alert.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{new Date(alert.expiryDate).toLocaleDateString()}</span>
                      <Badge
                        variant="outline"
                        style={{
                          color: alert.isExpired ? STATUS_COLOR_VAR.critical : STATUS_COLOR_VAR.warning,
                          borderColor: alert.isExpired ? STATUS_COLOR_VAR.critical : STATUS_COLOR_VAR.warning,
                        }}
                      >
                        {alert.isExpired ? `Expired ${Math.abs(alert.daysUntilExpiry)}d ago` : `${alert.daysUntilExpiry}d left`}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function AlertsView() {
  const lowStockQuery = useLowStockAlerts();
  const expiryQuery = useExpiryAlerts(30);

  return (
    <Tabs defaultValue="low-stock">
      <TabsList>
        <TabsTrigger value="low-stock">
          Low Stock{lowStockQuery.data ? ` (${lowStockQuery.data.length})` : ''}
        </TabsTrigger>
        <TabsTrigger value="expiring">
          Expiring Soon{expiryQuery.data ? ` (${expiryQuery.data.length})` : ''}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="low-stock" className="pt-4">
        <LowStockAlertsTab />
      </TabsContent>
      <TabsContent value="expiring" className="pt-4">
        <ExpiryAlertsTab />
      </TabsContent>
    </Tabs>
  );
}
