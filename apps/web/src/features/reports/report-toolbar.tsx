'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FileDownIcon, PrinterIcon, SheetIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { reportsApi, type ReportKind } from './api';

/**
 * Phase 9 — Export PDF / Export Excel / Print, shown at the top of every report view. Export
 * downloads go through `apiClient.download` (auth header attached, unlike a plain `<a href>`);
 * Print uses the browser's native print dialog against this same page — every report view
 * wraps its filter controls and the `ReportsSubNav`/`PageHeader` in `print:hidden` (see
 * `reports-nav.tsx`) so only the report title, table and summary print.
 */
export function ReportToolbar({
  kind,
  params,
}: {
  kind: ReportKind;
  /** The exact filter params currently applied to the on-screen report (date range, status, etc). */
  params: Record<string, string | number | undefined>;
}) {
  const [pending, setPending] = useState<'pdf' | 'excel' | null>(null);

  async function handleExport(format: 'pdf' | 'excel') {
    setPending(format);
    try {
      await reportsApi.export(kind, format, params);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Export failed';
      toast.error(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => handleExport('pdf')}>
        <FileDownIcon /> {pending === 'pdf' ? 'Exporting…' : 'Export PDF'}
      </Button>
      <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => handleExport('excel')}>
        <SheetIcon /> {pending === 'excel' ? 'Exporting…' : 'Export Excel'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <PrinterIcon /> Print
      </Button>
    </div>
  );
}
