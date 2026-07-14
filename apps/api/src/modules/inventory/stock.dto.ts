export interface LowStockAlertDto {
  productId: string;
  sku: string;
  name: string;
  stockOnHand: number;
  reorderLevel: number;
}

export interface ExpiryAlertDto {
  lotId: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  lotNumber: string;
  quantity: number;
  expiryDate: Date;
  isExpired: boolean;
  daysUntilExpiry: number;
}

export interface ValuationLineDto {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  valuationTotal: number;
}

export interface ValuationSummaryDto {
  lines: ValuationLineDto[];
  grandTotal: number;
}
