'use client';

import { TaxPageShell } from '@/features/tax/tax-nav';
import { AuditLogView } from '@/features/tax/audit-log-view';

export default function Page() {
  return (
    <TaxPageShell title="Audit Logs" description="System audit trail for tax and compliance-related actions.">
      <AuditLogView />
    </TaxPageShell>
  );
}
