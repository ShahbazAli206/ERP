'use client';

import { InfoIcon, PercentIcon, ReceiptIcon, WalletIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatCard } from '@/components/shared/stat-card';
import { useComplianceDashboard } from './hooks';
import { formatCurrency } from './format';

/**
 * Simplified compliance summary — mirrors `taxService.complianceDashboard()`'s own framing
 * exactly (see `apps/api/src/modules/tax/tax.service.ts`): `estimatedTaxLiability` is
 * `totalInvoicedAmount x activeGstRatePercent / 100` with no per-line-item tax jurisdiction
 * rules, exemptions, or withholding calculations applied. The alert below states that plainly so
 * this never reads as a precise/authoritative figure.
 */
export function ComplianceDashboardView() {
  const query = useComplianceDashboard();
  const dashboard = query.data;

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <InfoIcon />
        <AlertTitle>Simplified demo estimate</AlertTitle>
        <AlertDescription>
          Estimated tax liability below is a simplified calculation (total invoiced amount x active GST
          rate) for demo purposes only — it does not apply per-line-item tax jurisdiction rules,
          exemptions, or withholding calculations, and should not be treated as a real tax filing figure.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Invoiced Amount"
          value={dashboard ? formatCurrency(dashboard.totalInvoicedAmount) : '—'}
          icon={ReceiptIcon}
          description="Sum of all non-cancelled invoices"
          isLoading={query.isLoading}
        />
        <StatCard
          title="Active GST Rate"
          value={dashboard?.activeGstRatePercent != null ? `${dashboard.activeGstRatePercent}%` : 'None active'}
          icon={PercentIcon}
          description="First active GST-type tax rate"
          isLoading={query.isLoading}
        />
        <StatCard
          title="Estimated Tax Liability"
          value={dashboard ? formatCurrency(dashboard.estimatedTaxLiability) : '—'}
          icon={WalletIcon}
          description="Simplified demo estimate — see note above"
          isLoading={query.isLoading}
        />
      </div>
    </div>
  );
}
