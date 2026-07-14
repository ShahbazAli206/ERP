import { ApiError } from '../../shared/ApiError';
import { pricingGroupsRepository } from './pricingGroups.repository';
import type { PricingGroupDto } from './pricingGroups.dto';
import type { CreatePricingGroupInput, UpdatePricingGroupInput } from './pricingGroups.validation';

export const pricingGroupsService = {
  async list(): Promise<PricingGroupDto[]> {
    const groups = await pricingGroupsRepository.list();
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      discountPercent: g.discountPercent,
      distributorCount: g._count.distributors,
    }));
  },

  create(input: CreatePricingGroupInput) {
    return pricingGroupsRepository.create(input);
  },

  async update(id: string, input: UpdatePricingGroupInput) {
    const existing = await pricingGroupsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Pricing group not found');
    }
    return pricingGroupsRepository.update(id, input);
  },

  async delete(id: string) {
    const existing = await pricingGroupsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Pricing group not found');
    }
    await pricingGroupsRepository.delete(id);
  },
};
