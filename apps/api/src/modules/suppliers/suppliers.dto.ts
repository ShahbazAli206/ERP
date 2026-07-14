export interface SupplierListItemDto {
  id: string;
  name: string;
  country: string;
  currency: string;
  isActive: boolean;
  contactCount: number;
  createdAt: Date;
}

export interface SupplierContactDto {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
}

export interface SupplierPurchaseHistoryItemDto {
  purchaseOrderId: string;
  poNumber: string;
  status: string;
  orderDate: Date;
  totalAmount: number;
}

export interface SupplierProfileDto {
  id: string;
  name: string;
  country: string;
  currency: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  contacts: SupplierContactDto[];
  products: Array<{ id: string; sku: string; name: string }>;
  purchaseHistory: SupplierPurchaseHistoryItemDto[];
  outstandingBalance: number;
}
