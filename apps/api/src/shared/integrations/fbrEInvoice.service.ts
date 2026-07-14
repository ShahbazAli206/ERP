/**
 * FBR e-Invoicing — Integration Abstraction (Phase 4).
 *
 * Real FBR (Federal Board of Revenue, Pakistan) e-Invoicing integration submits invoices
 * for QR-code/reference-number issuance over their API (auth via FBR_API_BASE_URL /
 * FBR_API_KEY, see .env.example). Not integrated in this demo — this file defines the
 * interface a real implementation would satisfy, plus a fake that makes no network calls
 * so `tax.service.ts` has a formal abstraction to call instead of inlining the
 * "not integrated" response itself.
 */

export interface FbrInvoicePayload {
  invoiceNumber: string;
  totalAmount: number;
  buyerNtn?: string;
}

export interface FbrSubmissionResult {
  status: string;
  message: string;
  fbrReferenceNumber?: string;
}

export interface FbrEInvoiceService {
  /** Submit an invoice to FBR for QR/reference number issuance. */
  submitInvoice(payload: FbrInvoicePayload): Promise<FbrSubmissionResult>;
  /** Current integration status/placeholder shown in the demo UI. */
  getIntegrationStatus(): FbrSubmissionResult;
}

class FakeFbrEInvoiceService implements FbrEInvoiceService {
  async submitInvoice(payload: FbrInvoicePayload): Promise<FbrSubmissionResult> {
    console.log(
      `[FAKE FBR e-INVOICE] submitInvoice invoiceNumber=${payload.invoiceNumber} totalAmount=${payload.totalAmount} buyerNtn=${payload.buyerNtn ?? 'n/a'}`,
    );
    return this.getIntegrationStatus();
  }

  getIntegrationStatus(): FbrSubmissionResult {
    return {
      status: 'not_integrated',
      message:
        "FBR e-Invoicing integration is a placeholder for this demo — see the project's Phase 4 integration abstractions.",
    };
  }
}

export const fbrEInvoiceService: FbrEInvoiceService = new FakeFbrEInvoiceService();
