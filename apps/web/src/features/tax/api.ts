import { apiClient } from '@/lib/api-client';
import type { ListQueryParams } from '@/types/api';

export type TaxType = 'GST' | 'SALES_TAX' | 'WITHHOLDING_TAX';

/** Mirrors `TaxDto` in `apps/api/src/modules/tax/tax.dto.ts`. */
export interface TaxRate {
  id: string;
  name: string;
  type: TaxType;
  rate: number;
  appliesTo: string | null;
  isActive: boolean;
}

/** Mirrors `ComplianceDashboardDto`. */
export interface ComplianceDashboard {
  totalInvoicedAmount: number;
  activeGstRatePercent: number | null;
  estimatedTaxLiability: number;
}

/** Mirrors `EInvoiceStatusDto` — a static "not integrated" placeholder response, not a live status. */
export interface EInvoiceStatus {
  status: string;
  message: string;
}

/** Mirrors `AuditLogDto`. Nothing writes to `AuditLog` yet (a known separate backend gap), so this list is empty today. */
export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface TaxRateListParams extends ListQueryParams {
  type?: TaxType;
  isActive?: boolean;
}

/** Matches `createTaxSchema` in `tax.validation.ts`. */
export interface CreateTaxRateInput {
  name: string;
  type: TaxType;
  rate: number;
  appliesTo?: string;
  isActive?: boolean;
}

/** Matches `updateTaxSchema` (a `.partial()` of the create shape). */
export type UpdateTaxRateInput = Partial<CreateTaxRateInput>;

export const taxApi = {
  list: (params: TaxRateListParams) =>
    apiClient.getPaginated<TaxRate>('/tax', {
      page: params.page,
      pageSize: params.pageSize,
      type: params.type,
      isActive: params.isActive,
    }),
  create: (input: CreateTaxRateInput) => apiClient.post<TaxRate>('/tax', input),
  update: (id: string, input: UpdateTaxRateInput) => apiClient.patch<TaxRate>(`/tax/${id}`, input),
  /** Hard delete — `DELETE /tax/:id`, returns 204. No dependents/soft-delete for tax rates per the backend. */
  remove: (id: string) => apiClient.delete(`/tax/${id}`),
  complianceDashboard: () => apiClient.get<ComplianceDashboard>('/tax/compliance-dashboard'),
  eInvoiceStatus: () => apiClient.get<EInvoiceStatus>('/tax/e-invoice'),
  auditLogs: (params: ListQueryParams) =>
    apiClient.getPaginated<AuditLogEntry>('/tax/audit-logs', {
      page: params.page,
      pageSize: params.pageSize,
    }),
};
