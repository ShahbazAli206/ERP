import { apiClient } from '@/lib/api-client';

/** Mirrors `PricingGroupDto` in `apps/api/src/modules/distributors/pricingGroups.dto.ts`. */
export interface PricingGroup {
  id: string;
  name: string;
  discountPercent: number;
  distributorCount: number;
}

/** Matches `createPricingGroupSchema` in `pricingGroups.validation.ts`. */
export interface CreatePricingGroupInput {
  name: string;
  discountPercent: number;
}

/** Matches `updatePricingGroupSchema` (a `.partial()` of the create shape). */
export type UpdatePricingGroupInput = Partial<CreatePricingGroupInput>;

export const pricingGroupsApi = {
  /** Not paginated — `pricingGroupsService.list()` always returns the full set. */
  list: () => apiClient.get<PricingGroup[]>('/distributors/pricing-groups'),
  create: (input: CreatePricingGroupInput) => apiClient.post<PricingGroup>('/distributors/pricing-groups', input),
  update: (id: string, input: UpdatePricingGroupInput) =>
    apiClient.patch<PricingGroup>(`/distributors/pricing-groups/${id}`, input),
  /**
   * Deletes the group. Per `pricingGroups.repository.ts`'s `delete`, this
   * first sets `pricingGroupId: null` on every distributor referencing it —
   * distributors are orphaned (unassigned), never blocked from deletion.
   */
  delete: (id: string) => apiClient.delete(`/distributors/pricing-groups/${id}`),
};
