import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { fbrEInvoiceService } from '../../shared/integrations/fbrEInvoice.service';
import { taxRepository } from './tax.repository';
import type {
  AuditLogDto,
  ComplianceDashboardDto,
  EInvoiceStatusDto,
  TaxDto,
} from './tax.dto';
import type {
  CreateTaxInput,
  ListAuditLogsQuery,
  ListTaxesQuery,
  UpdateTaxInput,
} from './tax.validation';

function toTaxDto(tax: {
  id: string;
  name: string;
  type: string;
  rate: number;
  appliesTo: string | null;
  isActive: boolean;
}): TaxDto {
  return {
    id: tax.id,
    name: tax.name,
    type: tax.type,
    rate: tax.rate,
    appliesTo: tax.appliesTo,
    isActive: tax.isActive,
  };
}

export const taxService = {
  async list(query: ListTaxesQuery): Promise<{ items: TaxDto[]; pagination: Pagination }> {
    const { total, taxes } = await taxRepository.list(query);
    return {
      items: taxes.map(toTaxDto),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async create(input: CreateTaxInput): Promise<TaxDto> {
    const tax = await taxRepository.create(input);
    return toTaxDto(tax);
  },

  async update(id: string, input: UpdateTaxInput): Promise<TaxDto> {
    const existing = await taxRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Tax not found');
    }
    const tax = await taxRepository.update(id, input);
    return toTaxDto(tax);
  },

  async delete(id: string): Promise<void> {
    const existing = await taxRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Tax not found');
    }
    await taxRepository.delete(id);
  },

  async complianceDashboard(): Promise<ComplianceDashboardDto> {
    const [totalInvoicedAmount, activeGst] = await Promise.all([
      taxRepository.totalInvoicedAmount(),
      taxRepository.findFirstActiveGst(),
    ]);

    const activeGstRatePercent = activeGst?.rate ?? null;

    // Simplified demo estimate only — not real tax accounting (no per-line-item tax
    // jurisdiction rules, exemptions, or withholding calculations are applied here).
    const estimatedTaxLiability = (totalInvoicedAmount * (activeGstRatePercent ?? 0)) / 100;

    return {
      totalInvoicedAmount,
      activeGstRatePercent,
      estimatedTaxLiability,
    };
  },

  eInvoiceStatus(): EInvoiceStatusDto {
    // Sourced from the formal FBR e-Invoicing abstraction (Phase 4) instead of being
    // inlined here — same observable response shape as before.
    const { status, message } = fbrEInvoiceService.getIntegrationStatus();
    return { status, message };
  },

  async listAuditLogs(
    query: ListAuditLogsQuery,
  ): Promise<{ items: AuditLogDto[]; pagination: Pagination }> {
    const { total, logs } = await taxRepository.listAuditLogs(query);
    return {
      items: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },
};
