import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { distributorsRepository } from './distributors.repository';
import type { DistributorListItemDto, DistributorProfileDto } from './distributors.dto';
import type {
  CreateDistributorInput,
  ListDistributorsQuery,
  UpdateDistributorInput,
} from './distributors.validation';

export const distributorsService = {
  async list(
    query: ListDistributorsQuery,
  ): Promise<{ items: DistributorListItemDto[]; pagination: Pagination }> {
    const { total, distributors } = await distributorsRepository.list(query);
    return {
      items: distributors.map((d) => ({
        id: d.id,
        name: d.name,
        region: d.region,
        creditLimit: d.creditLimit,
        pricingGroupName: d.pricingGroup?.name ?? null,
        isActive: d.isActive,
        createdAt: d.createdAt,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getProfile(id: string): Promise<DistributorProfileDto> {
    const distributor = await distributorsRepository.findById(id);
    if (!distributor) {
      throw ApiError.notFound('Distributor not found');
    }

    const [salesHistory, paymentHistory, outstandingBalance] = await Promise.all([
      distributorsRepository.salesHistory(id),
      distributorsRepository.paymentHistory(id),
      distributorsRepository.outstandingBalance(id),
    ]);

    return {
      id: distributor.id,
      name: distributor.name,
      region: distributor.region,
      creditLimit: distributor.creditLimit,
      contactName: distributor.contactName,
      contactEmail: distributor.contactEmail,
      contactPhone: distributor.contactPhone,
      address: distributor.address,
      isActive: distributor.isActive,
      pricingGroup: distributor.pricingGroup
        ? {
            id: distributor.pricingGroup.id,
            name: distributor.pricingGroup.name,
            discountPercent: distributor.pricingGroup.discountPercent,
          }
        : null,
      outstandingBalance,
      salesHistory,
      paymentHistory: paymentHistory.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        currency: p.currency,
        paymentDate: p.paymentDate,
        reference: p.reference,
      })),
      createdAt: distributor.createdAt,
      updatedAt: distributor.updatedAt,
    };
  },

  async create(input: CreateDistributorInput) {
    const { pricingGroupId, ...rest } = input;
    return distributorsRepository.create({
      ...rest,
      pricingGroup: pricingGroupId ? { connect: { id: pricingGroupId } } : undefined,
    });
  },

  async update(id: string, input: UpdateDistributorInput) {
    const existing = await distributorsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Distributor not found');
    }
    const { pricingGroupId, ...rest } = input;
    return distributorsRepository.update(id, {
      ...rest,
      pricingGroup: pricingGroupId ? { connect: { id: pricingGroupId } } : undefined,
    });
  },

  async deactivate(id: string) {
    const existing = await distributorsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Distributor not found');
    }
    await distributorsRepository.deactivate(id);
  },
};
