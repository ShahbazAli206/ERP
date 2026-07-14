'use client';

import { PlugZap2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEInvoiceStatus } from './hooks';

/**
 * FBR e-Invoicing placeholder screen. `GET /tax/e-invoice` returns a static "not integrated"
 * response from `fbrEInvoiceService.getIntegrationStatus()` (see
 * `apps/api/src/shared/integrations/fbrEInvoice.service.ts`) — there is no live submission flow to
 * build here, intentionally, per the spec. This just displays that status/message as-is.
 */
export function EInvoiceView() {
  const query = useEInvoiceStatus();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <PlugZap2Icon className="size-4.5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle>FBR E-Invoicing</CardTitle>
            <CardDescription>Federal Board of Revenue (Pakistan) e-Invoicing integration status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : query.data ? (
          <>
            <Badge variant="outline">{query.data.status}</Badge>
            <p className="text-sm text-muted-foreground">{query.data.message}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load e-invoice status.</p>
        )}
      </CardContent>
    </Card>
  );
}
