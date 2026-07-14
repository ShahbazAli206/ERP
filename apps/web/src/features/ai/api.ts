import { apiClient } from '@/lib/api-client';

/**
 * AI Dashboard — Demo Only (Phase 8.13). Mirrors `apps/api/src/modules/ai/ai.dto.ts` exactly.
 *
 * Per the spec (`project_description.txt`, Module 13) this module does NOT integrate any real
 * AI/ML service. `bestSellingProducts` and `slowMovingInventory` are real aggregations over
 * sales/inventory data; the other four endpoints return generated placeholder data from
 * `apps/api/src/shared/integrations/aiForecasting.service.ts`, intended purely to populate demo
 * charts. None of these are paginated list endpoints — all return plain arrays via
 * `apiClient.get`, not `apiClient.getPaginated`.
 */

/** Mirrors `BestSellingProductDto` — real aggregation: top 10 by quantity sold on delivered orders. */
export interface BestSellingProduct {
  productId: string;
  sku: string;
  name: string;
  quantitySold: number;
}

/** Mirrors `SlowMovingInventoryItemDto` — real aggregation: in-stock products with no recent sale. */
export interface SlowMovingInventoryItem {
  productId: string;
  sku: string;
  name: string;
  stockOnHand: number;
  /** `Date | null` on the API DTO, serialized as an ISO string (or null) over JSON. */
  lastSaleDate: string | null;
}

/** Mirrors `DemandForecastMonthDto` — demo-generated. */
export interface DemandForecastMonth {
  month: string;
  predictedDemand: number;
}

/** Mirrors `DemandForecastProductDto` — demo-generated 6-month forecast for a sample of real products. */
export interface DemandForecastProduct {
  productId: string;
  productName: string;
  forecast: DemandForecastMonth[];
}

/** Mirrors `SeasonalIndexDto` — demo-generated, one entry per calendar month. */
export interface SeasonalIndex {
  month: string;
  seasonalIndex: number;
}

/** Mirrors `ImportRecommendationDto` — demo-generated. */
export interface ImportRecommendation {
  productName: string;
  recommendedOrderQuantity: number;
  reason: string;
}

/** Mirrors `PredictiveChartPointDto` — demo-generated. */
export interface PredictiveChartPoint {
  date: string;
  value: number;
}

/** Mirrors `PredictiveChartSeriesDto` — demo-generated time series. */
export interface PredictiveChartSeries {
  label: string;
  points: PredictiveChartPoint[];
}

export const aiApi = {
  bestSellingProducts: () => apiClient.get<BestSellingProduct[]>('/ai/best-selling-products'),
  slowMovingInventory: () => apiClient.get<SlowMovingInventoryItem[]>('/ai/slow-moving-inventory'),
  demandForecast: () => apiClient.get<DemandForecastProduct[]>('/ai/demand-forecast'),
  seasonalAnalysis: () => apiClient.get<SeasonalIndex[]>('/ai/seasonal-analysis'),
  importRecommendation: () => apiClient.get<ImportRecommendation[]>('/ai/import-recommendation'),
  predictiveCharts: () => apiClient.get<PredictiveChartSeries[]>('/ai/predictive-charts'),
};
