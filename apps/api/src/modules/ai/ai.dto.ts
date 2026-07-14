export interface BestSellingProductDto {
  productId: string;
  sku: string;
  name: string;
  quantitySold: number;
}

export interface SlowMovingInventoryItemDto {
  productId: string;
  sku: string;
  name: string;
  stockOnHand: number;
  lastSaleDate: Date | null;
}

export interface DemandForecastMonthDto {
  month: string;
  predictedDemand: number;
}

export interface DemandForecastProductDto {
  productId: string;
  productName: string;
  forecast: DemandForecastMonthDto[];
}

export interface SeasonalIndexDto {
  month: string;
  seasonalIndex: number;
}

export interface ImportRecommendationDto {
  productName: string;
  recommendedOrderQuantity: number;
  reason: string;
}

export interface PredictiveChartPointDto {
  date: string;
  value: number;
}

export interface PredictiveChartSeriesDto {
  label: string;
  points: PredictiveChartPointDto[];
}
