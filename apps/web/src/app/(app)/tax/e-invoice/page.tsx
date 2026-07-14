'use client';

import { TaxPageShell } from '@/features/tax/tax-nav';
import { EInvoiceView } from '@/features/tax/e-invoice-view';

export default function Page() {
  return (
    <TaxPageShell title="E-Invoice" description="FBR e-Invoicing integration status.">
      <EInvoiceView />
    </TaxPageShell>
  );
}
