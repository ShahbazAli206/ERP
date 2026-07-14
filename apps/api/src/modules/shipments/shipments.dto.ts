export interface ShipmentListItemDto {
  id: string;
  shipmentNumber: string;
  containerNumber: string | null;
  originPort: string;
  destinationPort: string;
  status: string;
  estimatedArrival: Date | null;
  actualArrival: Date | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  createdAt: Date;
}

export interface LandedCostItemDto {
  productId: string;
  productName: string;
  quantity: number;
  poUnitCost: number | null;
  allocatedLandedCostBase: number;
  landedUnitCostBase: number;
}

export interface LandedCostSummaryDto {
  freightCost: number;
  insuranceCost: number;
  dutyCost: number;
  customsCharges: number;
  currency: string;
  exchangeRateToBase: number;
  totalAdditionalCostBase: number;
  items: LandedCostItemDto[];
}

export interface ShipmentDetailDto {
  id: string;
  shipmentNumber: string;
  containerNumber: string | null;
  originPort: string;
  destinationPort: string;
  status: string;
  estimatedArrival: Date | null;
  actualArrival: Date | null;
  currency: string;
  purchaseOrderId: string | null;
  poNumber: string | null;
  items: Array<{ productId: string; productName: string; productSku: string; quantity: number }>;
  statusHistory: Array<{
    status: string;
    note: string | null;
    changedAt: Date;
    changedByName: string | null;
  }>;
  landedCostSummary: LandedCostSummaryDto;
  createdAt: Date;
  updatedAt: Date;
}
