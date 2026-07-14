export interface DistributorListItemDto {
  id: string;
  name: string;
  region: string;
  creditLimit: number;
  pricingGroupName: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface SalesHistoryItemDto {
  salesOrderId: string;
  orderNumber: string;
  status: string;
  orderDate: Date;
  totalAmount: number;
}

export interface PaymentHistoryItemDto {
  id: string;
  amount: number;
  method: string;
  currency: string;
  paymentDate: Date;
  reference: string | null;
}

export interface DistributorProfileDto {
  id: string;
  name: string;
  region: string;
  creditLimit: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  isActive: boolean;
  pricingGroup: { id: string; name: string; discountPercent: number } | null;
  outstandingBalance: number;
  salesHistory: SalesHistoryItemDto[];
  paymentHistory: PaymentHistoryItemDto[];
  createdAt: Date;
  updatedAt: Date;
}
