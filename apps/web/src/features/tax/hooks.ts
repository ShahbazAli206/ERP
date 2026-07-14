'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListQueryParams } from '@/types/api';
import {
  taxApi,
  type CreateTaxRateInput,
  type TaxRateListParams,
  type UpdateTaxRateInput,
} from './api';

const TAX_RATES_LIST_KEY = ['tax', 'rates'] as const;
const TAX_COMPLIANCE_DASHBOARD_KEY = ['tax', 'compliance-dashboard'] as const;
const TAX_E_INVOICE_KEY = ['tax', 'e-invoice'] as const;
const TAX_AUDIT_LOGS_KEY = ['tax', 'audit-logs'] as const;

export function useTaxRates(params: TaxRateListParams) {
  return useQuery({
    queryKey: [...TAX_RATES_LIST_KEY, params],
    queryFn: () => taxApi.list(params),
  });
}

export function useCreateTaxRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaxRateInput) => taxApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RATES_LIST_KEY });
      // A rate change (esp. an active GST rate) can move the compliance dashboard's estimate.
      queryClient.invalidateQueries({ queryKey: TAX_COMPLIANCE_DASHBOARD_KEY });
    },
  });
}

export function useUpdateTaxRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaxRateInput }) => taxApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RATES_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_COMPLIANCE_DASHBOARD_KEY });
    },
  });
}

export function useDeleteTaxRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_RATES_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: TAX_COMPLIANCE_DASHBOARD_KEY });
    },
  });
}

export function useComplianceDashboard() {
  return useQuery({
    queryKey: TAX_COMPLIANCE_DASHBOARD_KEY,
    queryFn: () => taxApi.complianceDashboard(),
  });
}

export function useEInvoiceStatus() {
  return useQuery({
    queryKey: TAX_E_INVOICE_KEY,
    queryFn: () => taxApi.eInvoiceStatus(),
    staleTime: 5 * 60_000,
  });
}

export function useAuditLogs(params: ListQueryParams) {
  return useQuery({
    queryKey: [...TAX_AUDIT_LOGS_KEY, params],
    queryFn: () => taxApi.auditLogs(params),
  });
}
