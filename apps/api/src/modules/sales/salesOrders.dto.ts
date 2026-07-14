export interface SalesOrderListItemDto {
  id: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  status: string;
  currency: string;
  orderDate: Date;
  totalAmount: number;
  createdAt: Date;
}

export interface SalesOrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  effectiveDiscountPercent: number;
  lineTotal: number;
}

export interface SalesOrderDetailDto {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  discountPercent: number;
  orderDate: Date;
  distributor: { id: string; name: string; region: string; pricingGroupDiscountPercent: number };
  createdByName: string;
  items: SalesOrderItemDto[];
  statusHistory: Array<{
    status: string;
    note: string | null;
    changedAt: Date;
    changedByName: string | null;
  }>;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
