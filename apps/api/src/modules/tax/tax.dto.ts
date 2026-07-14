export interface TaxDto {
  id: string;
  name: string;
  type: string;
  rate: number;
  appliesTo: string | null;
  isActive: boolean;
}

export interface ComplianceDashboardDto {
  totalInvoicedAmount: number;
  activeGstRatePercent: number | null;
  estimatedTaxLiability: number;
}

export interface EInvoiceStatusDto {
  status: string;
  message: string;
}

export interface AuditLogDto {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: string | null;
  createdAt: Date;
}
