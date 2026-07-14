import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  shipmentRelatedApi,
  shipmentsApi,
  type ShipmentListParams,
} from './api';
import type {
  CreateShipmentFormValues,
  UpdateShipmentFormValues,
  UpdateShipmentStatusFormValues,
} from './schemas';

const SHIPMENTS_KEY = ['shipments'] as const;

export function useShipments(params: ShipmentListParams) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'list', params],
    queryFn: () => shipmentsApi.list(params),
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'detail', id],
    queryFn: () => shipmentsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShipmentFormValues) => shipmentsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SHIPMENTS_KEY, 'list'] });
    },
  });
}

export function useUpdateShipment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateShipmentFormValues) => shipmentsApi.update(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData([...SHIPMENTS_KEY, 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: [...SHIPMENTS_KEY, 'list'] });
    },
  });
}

export function useUpdateShipmentStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateShipmentStatusFormValues) => shipmentsApi.updateStatus(id, input),
    onSuccess: (data) => {
      queryClient.setQueryData([...SHIPMENTS_KEY, 'detail', id], data);
      queryClient.invalidateQueries({ queryKey: [...SHIPMENTS_KEY, 'list'] });
    },
  });
}

export function useDeleteShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SHIPMENTS_KEY, 'list'] });
    },
  });
}

/** Options for the create form's "link to a purchase order" select. */
export function usePurchaseOrderOptions() {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'purchase-order-options'],
    queryFn: () => shipmentRelatedApi.purchaseOrderOptions(),
    staleTime: 60_000,
  });
}

/** Full PO detail (with items) — used to prefill the shipment items list once a PO is picked. */
export function usePurchaseOrderDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'purchase-order', id],
    queryFn: () => shipmentRelatedApi.purchaseOrder(id!),
    enabled: Boolean(id),
  });
}

/** Options for the per-item product select on standalone (no-PO) shipments. */
export function useProductOptions() {
  return useQuery({
    queryKey: [...SHIPMENTS_KEY, 'product-options'],
    queryFn: () => shipmentRelatedApi.productOptions(),
    staleTime: 60_000,
  });
}
