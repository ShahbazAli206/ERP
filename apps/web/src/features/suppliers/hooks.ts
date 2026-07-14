'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  suppliersApi,
  type CreateSupplierInput,
  type SupplierContactInput,
  type SupplierListParams,
  type UpdateSupplierInput,
} from './api';

const SUPPLIERS_LIST_KEY = ['suppliers', 'list'] as const;
const SUPPLIERS_COUNTRIES_KEY = ['suppliers', 'countries'] as const;
const supplierDetailKey = (id: string) => ['suppliers', 'detail', id] as const;

export function useSuppliers(params: SupplierListParams) {
  return useQuery({
    queryKey: [...SUPPLIERS_LIST_KEY, params],
    queryFn: () => suppliersApi.list(params),
  });
}

/**
 * Derives the distinct list of countries for the list page's filter dropdown.
 * There's no dedicated "distinct countries" endpoint, and with only ~20 demo
 * suppliers (well under the API's 100 max page size), fetching one large
 * page and de-duplicating client-side is simpler than adding a new backend
 * endpoint for this — see the report for the caveat if the seed data grows
 * past 100 suppliers.
 */
export function useSupplierCountries() {
  return useQuery({
    queryKey: SUPPLIERS_COUNTRIES_KEY,
    queryFn: async () => {
      const result = await suppliersApi.list({ page: 1, pageSize: 100, sortBy: 'country', sortOrder: 'asc' });
      return Array.from(new Set(result.data.map((s) => s.country))).sort();
    },
    staleTime: 5 * 60_000,
  });
}

export function useSupplier(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: supplierDetailKey(id ?? ''),
    queryFn: () => suppliersApi.get(id as string),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => suppliersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_COUNTRIES_KEY });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) => suppliersApi.update(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_COUNTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: supplierDetailKey(variables.id) });
    },
  });
}

export function useDeactivateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.deactivate(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: supplierDetailKey(id) });
    },
  });
}

export function useAddSupplierContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, input }: { supplierId: string; input: SupplierContactInput }) =>
      suppliersApi.addContact(supplierId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierDetailKey(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_LIST_KEY });
    },
  });
}

export function useRemoveSupplierContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, contactId }: { supplierId: string; contactId: string }) =>
      suppliersApi.removeContact(supplierId, contactId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierDetailKey(variables.supplierId) });
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_LIST_KEY });
    },
  });
}
