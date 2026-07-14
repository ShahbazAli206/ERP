'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pricingGroupsApi, type CreatePricingGroupInput, type UpdatePricingGroupInput } from './pricing-groups-api';

const PRICING_GROUPS_KEY = ['distributors', 'pricing-groups'] as const;
// Distributor list rows/profiles embed the pricing group's name/discount, so
// a pricing group mutation invalidates those caches too — most importantly
// on delete, since the backend orphans (nulls out) any distributor's
// `pricingGroupId` rather than blocking the delete (see `pricing-groups-api.ts`).
const DISTRIBUTORS_LIST_KEY = ['distributors', 'list'] as const;
const DISTRIBUTORS_DETAIL_KEY = ['distributors', 'detail'] as const;

export function usePricingGroups() {
  return useQuery({
    queryKey: PRICING_GROUPS_KEY,
    queryFn: () => pricingGroupsApi.list(),
  });
}

function invalidateDistributorCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_LIST_KEY });
  queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_DETAIL_KEY });
}

export function useCreatePricingGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePricingGroupInput) => pricingGroupsApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRICING_GROUPS_KEY }),
  });
}

export function useUpdatePricingGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePricingGroupInput }) => pricingGroupsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICING_GROUPS_KEY });
      invalidateDistributorCaches(queryClient);
    },
  });
}

export function useDeletePricingGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pricingGroupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRICING_GROUPS_KEY });
      invalidateDistributorCaches(queryClient);
    },
  });
}
