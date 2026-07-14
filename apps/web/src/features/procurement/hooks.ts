'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import { getSessionToken } from '@/lib/session';
import {
  procurementApi,
  type CreatePurchaseOrderInput,
  type PurchaseOrderListParams,
  type UpdatePurchaseOrderInput,
} from './api';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');

export const purchaseOrderKeys = {
  all: ['procurement', 'purchase-orders'] as const,
  list: (params: PurchaseOrderListParams) => ['procurement', 'purchase-orders', 'list', params] as const,
  detail: (id: string) => ['procurement', 'purchase-orders', 'detail', id] as const,
};

export function usePurchaseOrders(params: PurchaseOrderListParams) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => procurementApi.list(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => procurementApi.get(id),
    enabled: Boolean(id),
  });
}

export function useSuppliersForSelect() {
  return useQuery({
    queryKey: ['procurement', 'suppliers-for-select'],
    queryFn: () => procurementApi.listSuppliers(),
    staleTime: 60_000,
  });
}

export function useProductsForSelect() {
  return useQuery({
    queryKey: ['procurement', 'products-for-select'],
    queryFn: () => procurementApi.listProducts(),
    staleTime: 60_000,
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) => procurementApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success('Purchase order created as a draft.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create the purchase order.')),
  });
}

export function useUpdatePurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePurchaseOrderInput) => procurementApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success('Purchase order updated.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the purchase order.')),
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => procurementApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success('Draft purchase order deleted.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete the purchase order.')),
  });
}

/** Shared success/error wiring for every status-transition mutation (submit/approve/reject/mark-ordered/cancel). */
function useTransition(id: string, fn: (id: string) => Promise<unknown>, successMessage: string, failMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success(successMessage);
    },
    onError: (error) => toast.error(errorMessage(error, failMessage)),
  });
}

export function useSubmitPurchaseOrder(id: string) {
  return useTransition(id, procurementApi.submit, 'Submitted for approval.', 'Could not submit the purchase order.');
}

export function useApprovePurchaseOrder(id: string) {
  return useTransition(id, procurementApi.approve, 'Purchase order approved.', 'Could not approve the purchase order.');
}

export function useMarkOrderedPurchaseOrder(id: string) {
  return useTransition(id, procurementApi.markOrdered, 'Marked as ordered.', 'Could not mark the purchase order as ordered.');
}

export function useCancelPurchaseOrder(id: string) {
  return useTransition(id, procurementApi.cancel, 'Purchase order cancelled.', 'Could not cancel the purchase order.');
}

export function useRejectPurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => procurementApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      toast.success('Purchase order rejected.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not reject the purchase order.')),
  });
}

export function useUploadAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => procurementApi.uploadAttachment(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      toast.success('Attachment uploaded.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not upload the attachment.')),
  });
}

export function useRemoveAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => procurementApi.removeAttachment(id, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) });
      toast.success('Attachment removed.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not remove the attachment.')),
  });
}

/**
 * Attachment download isn't a JSON envelope (it's `res.download()` on the
 * API side), so it bypasses `apiClient` and fetches the file directly as a
 * blob, attaching the same bearer token, then triggers a browser download.
 */
export async function downloadAttachment(poId: string, attachmentId: string, fileName: string) {
  const token = getSessionToken();
  const downloadPath = procurementApi.attachmentDownloadPath(poId, attachmentId).replace(/^\/+/, '');
  const response = await fetch(`${API_BASE_URL}/${downloadPath}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error('Download failed');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
