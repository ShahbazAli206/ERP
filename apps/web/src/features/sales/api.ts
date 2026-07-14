import { apiClient } from '@/lib/api-client';
import type { InvoiceStatus, PaymentMethod, SalesOrderStatus } from './status';

// ── Sales Orders ────────────────────────────────────────────────────────────

export interface SalesOrderListItem {
  id: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  status: SalesOrderStatus;
  currency: string;
  orderDate: string;
  totalAmount: number;
  createdAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  /** item discount + distributor pricing-group discount + automatic volume discount, summed and capped at 100 (see `shared/pricing.ts`). */
  effectiveDiscountPercent: number;
  lineTotal: number;
}

export interface StatusHistoryEntry {
  status: SalesOrderStatus;
  note: string | null;
  changedAt: string;
  changedByName: string | null;
}

export interface SalesOrderDetail {
  id: string;
  orderNumber: string;
  status: SalesOrderStatus;
  currency: string;
  /** Order-level discount applied on top of each line's already-discounted total. */
  discountPercent: number;
  orderDate: string;
  distributor: { id: string; name: string; region: string; pricingGroupDiscountPercent: number };
  createdByName: string;
  items: SalesOrderItem[];
  statusHistory: StatusHistoryEntry[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderListParams {
  page?: number;
  pageSize?: number;
  status?: SalesOrderStatus;
  distributorId?: string;
  search?: string;
  sortBy?: 'orderDate' | 'createdAt' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface SalesOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CreateSalesOrderInput {
  distributorId: string;
  currency: string;
  discountPercent: number;
  items: SalesOrderItemInput[];
}

export type UpdateSalesOrderInput = Partial<Omit<CreateSalesOrderInput, 'distributorId'>>;

/**
 * Minimal read-only shapes for the distributor/product/warehouse pickers used
 * by the sales order create form and status-transition dialogs. These
 * deliberately duplicate (a subset of) the Distributors/Inventory modules'
 * own DTOs rather than importing from their `features/` folders, per this
 * module's isolation boundary — Distributors and Inventory are being built
 * concurrently in sibling folders.
 */
export interface DistributorOption {
  id: string;
  name: string;
  region: string;
  isActive: boolean;
}

export interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  sellingPrice: number;
  stockOnHand: number;
  isActive: boolean;
}

export interface WarehouseOption {
  id: string;
  name: string;
  location: string | null;
}

const ORDERS_PATH = '/sales/orders';
const INVOICES_PATH = '/sales/invoices';
const RETURNS_PATH = '/sales/returns';
const CREDIT_NOTES_PATH = '/sales/credit-notes';

export const salesOrdersApi = {
  list: (params: SalesOrderListParams) => apiClient.getPaginated<SalesOrderListItem>(ORDERS_PATH, { ...params }),

  get: (id: string) => apiClient.get<SalesOrderDetail>(`${ORDERS_PATH}/${id}`),

  create: (input: CreateSalesOrderInput) => apiClient.post<SalesOrderDetail>(ORDERS_PATH, input),

  update: (id: string, input: UpdateSalesOrderInput) =>
    apiClient.patch<SalesOrderDetail>(`${ORDERS_PATH}/${id}`, input),

  remove: (id: string) => apiClient.delete(`${ORDERS_PATH}/${id}`),

  confirm: (id: string, warehouseId: string) =>
    apiClient.post<SalesOrderDetail>(`${ORDERS_PATH}/${id}/confirm`, { warehouseId }),

  advance: (id: string) => apiClient.post<SalesOrderDetail>(`${ORDERS_PATH}/${id}/advance`),

  cancel: (id: string) => apiClient.post<SalesOrderDetail>(`${ORDERS_PATH}/${id}/cancel`),

  listDistributors: () =>
    apiClient.getPaginated<DistributorOption>('/distributors', { pageSize: 100, isActive: true, sortBy: 'name', sortOrder: 'asc' }),

  listProducts: () =>
    apiClient.getPaginated<ProductOption>('/inventory/products', { pageSize: 100, isActive: true }),

  /** Unlike most list endpoints, `/inventory/warehouses` returns a plain (unpaginated) array. */
  listWarehouses: () => apiClient.get<WarehouseOption[]>('/inventory/warehouses'),
};

// ── Invoices ─────────────────────────────────────────────────────────────────

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  salesOrderId: string;
  orderNumber: string;
  distributorName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  reference: string | null;
}

export interface InvoiceDetail extends InvoiceListItem {
  currency: string;
  payments: InvoicePayment[];
  creditNotesTotal: number;
  balanceDue: number;
}

export interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  status?: InvoiceStatus;
  search?: string;
  sortBy?: 'issueDate' | 'dueDate' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateInvoiceInput {
  salesOrderId: string;
  dueInDays?: number;
}

export interface RecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  paymentDate?: string;
  reference?: string;
}

export const invoicesApi = {
  list: (params: InvoiceListParams) => apiClient.getPaginated<InvoiceListItem>(INVOICES_PATH, { ...params }),

  get: (id: string) => apiClient.get<InvoiceDetail>(`${INVOICES_PATH}/${id}`),

  create: (input: CreateInvoiceInput) => apiClient.post<InvoiceDetail>(INVOICES_PATH, input),

  recordPayment: (id: string, input: RecordPaymentInput) =>
    apiClient.post<InvoiceDetail>(`${INVOICES_PATH}/${id}/payments`, input),

  /**
   * There is no `?salesOrderId=` filter on `GET /sales/invoices` (only
   * `search` — which matches `invoiceNumber`, not the order number/id) and no
   * "one active invoice per order" convenience endpoint, so finding the
   * invoice for a given order means paging through the list (capped at 100
   * per page server-side) until a match turns up or the list is exhausted.
   * Fine for this demo's data volumes (a few hundred orders/invoices max).
   */
  async findBySalesOrderId(salesOrderId: string): Promise<InvoiceListItem | null> {
    let page = 1;
    for (;;) {
      const res = await invoicesApi.list({ page, pageSize: 100 });
      const match = res.data.find((inv) => inv.salesOrderId === salesOrderId);
      if (match) return match;
      if (page * 100 >= res.pagination.total) return null;
      page += 1;
    }
  },
};

// ── Returns & Credit Notes ───────────────────────────────────────────────────

export interface SalesReturn {
  id: string;
  salesOrderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string | null;
  hasCreditNote: boolean;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceId: string | null;
  salesReturnId: string | null;
  amount: number;
  reason: string | null;
  createdAt: string;
}

export interface CreateReturnInput {
  salesOrderId: string;
  productId: string;
  quantity: number;
  reason?: string;
  restock?: { warehouseId: string; lotNumber: string };
}

export interface CreateCreditNoteInput {
  salesReturnId?: string;
  invoiceId?: string;
  amount?: number;
  reason?: string;
}

export const returnsApi = {
  /** Both `/sales/returns` and `/sales/credit-notes` are plain (unpaginated) arrays — fine at this demo's data volume. */
  list: () => apiClient.get<SalesReturn[]>(RETURNS_PATH),

  create: (input: CreateReturnInput) => apiClient.post<SalesReturn>(RETURNS_PATH, input),

  listCreditNotes: () => apiClient.get<CreditNote[]>(CREDIT_NOTES_PATH),

  createCreditNote: (input: CreateCreditNoteInput) => apiClient.post<CreditNote>(CREDIT_NOTES_PATH, input),
};
