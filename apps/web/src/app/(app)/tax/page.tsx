'use client';

import { TaxPageShell } from '@/features/tax/tax-nav';
import { TaxRateListView } from '@/features/tax/tax-rate-list-view';

export default function Page() {
  return (
    <TaxPageShell title="Tax & Compliance" description="GST, sales tax, withholding, and e-invoicing.">
      <TaxRateListView />
    </TaxPageShell>
  );
}
