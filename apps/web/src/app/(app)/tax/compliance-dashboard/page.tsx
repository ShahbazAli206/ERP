'use client';

import { TaxPageShell } from '@/features/tax/tax-nav';
import { ComplianceDashboardView } from '@/features/tax/compliance-dashboard-view';

export default function Page() {
  return (
    <TaxPageShell
      title="Compliance Dashboard"
      description="Simplified summary of invoiced amounts, active GST rate, and estimated tax liability."
    >
      <ComplianceDashboardView />
    </TaxPageShell>
  );
}
