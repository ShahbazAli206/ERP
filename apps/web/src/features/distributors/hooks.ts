'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  distributorsApi,
  type CreateDistributorInput,
  type DistributorListParams,
  type UpdateDistributorInput,
} from './api';

const DISTRIBUTORS_LIST_KEY = ['distributors', 'list'] as const;
const DISTRIBUTORS_REGIONS_KEY = ['distributors', 'regions'] as const;
const DISTRIBUTORS_DETAIL_KEY = ['distributors', 'detail'] as const;
const distributorDetailKey = (id: string) => [...DISTRIBUTORS_DETAIL_KEY, id] as const;

export function useDistributors(params: DistributorListParams) {
  return useQuery({
    queryKey: [...DISTRIBUTORS_LIST_KEY, params],
    queryFn: () => distributorsApi.list(params),
  });
}

/**
 * Derives the distinct list of regions for the list page's filter dropdown.
 * There's no dedicated "distinct regions" endpoint, and with only 15 demo
 * distributors (well under the API's 100 max page size), fetching one large
 * page and de-duplicating client-side is simpler than adding a new backend
 * endpoint for this — see the report for the caveat if the seed data grows
 * past 100 distributors. Mirrors `features/suppliers/hooks.ts`'s
 * `useSupplierCountries`.
 */
export function useDistributorRegions() {
  return useQuery({
    queryKey: DISTRIBUTORS_REGIONS_KEY,
    queryFn: async () => {
      const result = await distributorsApi.list({ page: 1, pageSize: 100, sortBy: 'region', sortOrder: 'asc' });
      return Array.from(new Set(result.data.map((d) => d.region))).sort();
    },
    staleTime: 5 * 60_000,
  });
}

export function useDistributor(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: distributorDetailKey(id ?? ''),
    queryFn: () => distributorsApi.get(id as string),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useCreateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDistributorInput) => distributorsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_REGIONS_KEY });
    },
  });
}

export function useUpdateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDistributorInput }) => distributorsApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_REGIONS_KEY });
      queryClient.invalidateQueries({ queryKey: distributorDetailKey(variables.id) });
    },
  });
}

export function useDeactivateDistributor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => distributorsApi.deactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: DISTRIBUTORS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: distributorDetailKey(id) });
    },
  });
}
