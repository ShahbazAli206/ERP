export interface PurchaseOrderListItemDto {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  currency: string;
  orderDate: Date;
  expectedArrival: Date | null;
  totalAmount: number;
  createdAt: Date;
}

export interface PurchaseOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  receivedQuantity: number;
  lineTotal: number;
}

export interface PurchaseOrderAttachmentDto {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface StatusHistoryEntryDto {
  status: string;
  note: string | null;
  changedAt: Date;
  changedByName: string | null;
}

export interface PurchaseOrderDetailDto {
  id: string;
  poNumber: string;
  status: string;
  currency: string;
  exchangeRateToBase: number;
  orderDate: Date;
  expectedArrival: Date | null;
  notes: string | null;
  supplier: { id: string; name: string; country: string; currency: string };
  createdByName: string;
  approvedByName: string | null;
  items: PurchaseOrderItemDto[];
  attachments: PurchaseOrderAttachmentDto[];
  statusHistory: StatusHistoryEntryDto[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
