'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';
import {
  invoicesApi,
  returnsApi,
  salesOrdersApi,
  type CreateCreditNoteInput,
  type CreateReturnInput,
  type CreateSalesOrderInput,
  type InvoiceListParams,
  type RecordPaymentInput,
  type SalesOrderListParams,
  type UpdateSalesOrderInput,
} from './api';

export const salesKeys = {
  orders: {
    all: ['sales', 'orders'] as const,
    list: (params: SalesOrderListParams) => ['sales', 'orders', 'list', params] as const,
    detail: (id: string) => ['sales', 'orders', 'detail', id] as const,
  },
  invoices: {
    all: ['sales', 'invoices'] as const,
    list: (params: InvoiceListParams) => ['sales', 'invoices', 'list', params] as const,
    detail: (id: string) => ['sales', 'invoices', 'detail', id] as const,
    forOrder: (orderId: string) => ['sales', 'invoices', 'for-order', orderId] as const,
  },
  returns: {
    all: ['sales', 'returns'] as const,
  },
  creditNotes: {
    all: ['sales', 'credit-notes'] as const,
  },
  distributorsForSelect: ['sales', 'distributors-for-select'] as const,
  productsForSelect: ['sales', 'products-for-select'] as const,
  warehousesForSelect: ['sales', 'warehouses-for-select'] as const,
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

// ── Option lists (distributor/product/warehouse pickers) ────────────────────

export function useDistributorsForSelect() {
  return useQuery({
    queryKey: salesKeys.distributorsForSelect,
    queryFn: () => salesOrdersApi.listDistributors(),
    staleTime: 60_000,
  });
}

export function useProductsForSelect() {
  return useQuery({
    queryKey: salesKeys.productsForSelect,
    queryFn: () => salesOrdersApi.listProducts(),
    staleTime: 60_000,
  });
}

export function useWarehousesForSelect() {
  return useQuery({
    queryKey: salesKeys.warehousesForSelect,
    queryFn: () => salesOrdersApi.listWarehouses(),
    staleTime: 60_000,
  });
}

// ── Sales Orders ─────────────────────────────────────────────────────────────

export function useSalesOrders(params: SalesOrderListParams) {
  return useQuery({
    queryKey: salesKeys.orders.list(params),
    queryFn: () => salesOrdersApi.list(params),
  });
}

export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: salesKeys.orders.detail(id),
    queryFn: () => salesOrdersApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSalesOrderInput) => salesOrdersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.all });
      toast.success('Sales order created as a draft.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not create the sales order.')),
  });
}

export function useUpdateSalesOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSalesOrderInput) => salesOrdersApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.all });
      toast.success('Sales order updated.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not update the sales order.')),
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.all });
      toast.success('Draft sales order deleted.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not delete the sales order.')),
  });
}

/** Shared success/error wiring for advance/cancel (no extra input beyond the order id). */
function useOrderTransition(id: string, fn: (id: string) => Promise<unknown>, successMessage: string, failMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.all });
      toast.success(successMessage);
    },
    onError: (error) => toast.error(errorMessage(error, failMessage)),
  });
}

/**
 * Confirm needs a warehouse to consume stock FIFO from, and is the one
 * transition whose failure mode (insufficient stock) is worth surfacing
 * beyond a toast — callers should also read `mutation.error` directly (see
 * `confirm-order-dialog.tsx`) rather than relying on the toast alone.
 */
export function useConfirmSalesOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => salesOrdersApi.confirm(id, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.orders.all });
      toast.success('Order confirmed — stock consumed FIFO from the selected warehouse.');
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not confirm the order.')),
  });
}

export function useAdvanceSalesOrder(id: string) {
  return useOrderTransition(id, salesOrdersApi.advance, 'Order status advanced.', 'Could not advance the order.');
}

export function useCancelSalesOrder(id: string) {
  return useOrderTransition(id, salesOrdersApi.cancel, 'Order cancelled.', 'Could not cancel the order.');
}

// ── Invoices ─────────────────────────────────────────────────────────────────

export function useInvoices(params: InvoiceListParams) {
  return useQuery({
    queryKey: salesKeys.invoices.list(params),
    queryFn: () => invoicesApi.list(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: salesKeys.invoices.detail(id),
    queryFn: () => invoicesApi.get(id),
    enabled: Boolean(id),
  });
}

/** Finds (if any) the active invoice for a sales order and fetches its full detail (payments, credit notes, balance due). */
export function useInvoiceForOrder(orderId: string) {
  const listItemQuery = useQuery({
    queryKey: salesKeys.invoices.forOrder(orderId),
    queryFn: () => invoicesApi.findBySalesOrderId(orderId),
    enabled: Boolean(orderId),
  });
  const invoiceId = listItemQuery.data?.id;
  const detailQuery = useQuery({
    queryKey: salesKeys.invoices.detail(invoiceId ?? ''),
    queryFn: () => invoicesApi.get(invoiceId!),
    enabled: Boolean(invoiceId),
  });

  return {
    invoice: detailQuery.data,
    hasInvoice: Boolean(listItemQuery.data),
    isLoading: listItemQuery.isLoading || (Boolean(invoiceId) && detailQuery.isLoading),
    isError: listItemQuery.isError || detailQuery.isError,
  };
}

export function useGenerateInvoice(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dueInDays?: number) => invoicesApi.create({ salesOrderId: orderId, dueInDays }),
    onSuccess: (invoice) => {
      queryClient.setQueryData(salesKeys.invoices.detail(invoice.id), invoice);
      queryClient.setQueryData(salesKeys.invoices.forOrder(orderId), invoice);
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices.all });
      toast.success(`Invoice ${invoice.invoiceNumber} generated.`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not generate the invoice.')),
  });
}

export function useRecordPayment(invoiceId: string, orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) => invoicesApi.recordPayment(invoiceId, input),
    onSuccess: (invoice) => {
      queryClient.setQueryData(salesKeys.invoices.detail(invoice.id), invoice);
      queryClient.setQueryData(salesKeys.invoices.forOrder(orderId), invoice);
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices.all });
      toast.success(
        invoice.status === 'PAID'
          ? `Payment recorded — invoice ${invoice.invoiceNumber} is now fully paid.`
          : `Payment recorded — ${invoice.invoiceNumber} balance due updated.`,
      );
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record the payment.')),
  });
}

// ── Returns & Credit Notes ───────────────────────────────────────────────────

/** Full (unpaginated) return/credit-note lists, filtered client-side per order by callers — see `returns-section.tsx`. */
export function useReturns() {
  return useQuery({ queryKey: salesKeys.returns.all, queryFn: () => returnsApi.list() });
}

export function useCreditNotes() {
  return useQuery({ queryKey: salesKeys.creditNotes.all, queryFn: () => returnsApi.listCreditNotes() });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReturnInput) => returnsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.returns.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record the return.')),
  });
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCreditNoteInput) => returnsApi.createCreditNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.creditNotes.all });
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not issue the credit note.')),
  });
}

/**
 * Creates a return and immediately issues its credit note in one user-facing
 * action (amount left for the API to auto-compute from the order's effective
 * unit price — see `returns.service.ts`'s `createCreditNote`), then refreshes
 * every cache the credit note can affect: the return/credit-note lists and
 * the order's invoice (whose balance the new credit note reduces).
 */
export function useCreateReturnWithCreditNote(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReturnInput) => {
      const salesReturn = await returnsApi.create(input);
      const creditNote = await returnsApi.createCreditNote({ salesReturnId: salesReturn.id });
      return { salesReturn, creditNote };
    },
    onSuccess: ({ creditNote }) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.returns.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.creditNotes.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices.forOrder(orderId) });
      if (creditNote.invoiceId) {
        queryClient.invalidateQueries({ queryKey: salesKeys.invoices.detail(creditNote.invoiceId) });
      }
      toast.success(`Return recorded — credit note ${creditNote.creditNoteNumber} issued.`);
    },
    onError: (error) => toast.error(errorMessage(error, 'Could not record the return.')),
  });
}
