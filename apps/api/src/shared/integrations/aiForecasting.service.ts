/**
 * AI Forecasting Engine — Integration Abstraction (Phase 4).
 *
 * Real implementation would call an actual ML/forecasting service. Not integrated in this
 * demo — this file holds the random/generated-data logic that used to live inline in
 * `modules/ai/ai.service.ts` for the explicitly demo-only endpoints (demand forecast,
 * seasonal analysis, import recommendations, predictive charts). The real-aggregation
 * endpoints (`bestSellingProducts`, `slowMovingInventory`) are NOT part of this
 * abstraction — they query real sales/inventory data and stay in `ai.service.ts`.
 *
 * `ai.service.ts` still owns fetching the candidate product pool from the DB (that's real
 * data access, not a forecasting concern) and passes it in here for fake number
 * generation only.
 */

export interface ForecastInputProduct {
  id: string;
  name: string;
}

export interface ForecastMonthPoint {
  month: string;
  predictedDemand: number;
}

export interface ProductDemandForecast {
  productId: string;
  productName: string;
  forecast: ForecastMonthPoint[];
}

export interface SeasonalIndexPoint {
  month: string;
  seasonalIndex: number;
}

export interface ImportRecommendation {
  productName: string;
  recommendedOrderQuantity: number;
  reason: string;
}

export interface PredictiveSeriesPoint {
  date: string;
  value: number;
}

export interface PredictiveSeries {
  label: string;
  points: PredictiveSeriesPoint[];
}

export interface AiForecastingEngine {
  forecastDemand(products: ForecastInputProduct[], monthsAhead?: number): ProductDemandForecast[];
  seasonalAnalysis(): SeasonalIndexPoint[];
  recommendImports(products: ForecastInputProduct[]): ImportRecommendation[];
  predictiveCharts(): PredictiveSeries[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Canned, plausible-sounding reasons for the demo-only import recommendation endpoint.
const IMPORT_REASONS = [
  'Approaching reorder threshold based on projected demand',
  'Seasonal demand spike expected next quarter',
  'Lead time risk from supplier region suggests ordering early',
  'Recent sales velocity exceeds current stock coverage',
  'Stockout risk flagged by recent demand trend',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function monthLabel(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

class FakeAiForecastingEngine implements AiForecastingEngine {
  forecastDemand(
    products: ForecastInputProduct[],
    monthsAhead = 6,
  ): ProductDemandForecast[] {
    const pickCount = Math.min(products.length, randomInt(3, 5));
    const chosen = shuffled(products).slice(0, pickCount);
    const now = new Date();

    return chosen.map((product) => ({
      productId: product.id,
      productName: product.name,
      forecast: Array.from({ length: monthsAhead }, (_, i) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        return { month: monthLabel(monthDate), predictedDemand: randomInt(50, 500) };
      }),
    }));
  }

  seasonalAnalysis(): SeasonalIndexPoint[] {
    return MONTH_NAMES.map((month) => ({
      month,
      seasonalIndex: Number((0.5 + Math.random()).toFixed(2)),
    }));
  }

  recommendImports(products: ForecastInputProduct[]): ImportRecommendation[] {
    const pickCount = Math.min(products.length, randomInt(3, 5));
    const chosen = shuffled(products).slice(0, pickCount);

    return chosen.map((product) => ({
      productName: product.name,
      recommendedOrderQuantity: randomInt(50, 500),
      reason: IMPORT_REASONS[randomInt(0, IMPORT_REASONS.length - 1)],
    }));
  }

  predictiveCharts(): PredictiveSeries[] {
    const now = new Date();
    const pointCount = 12;

    const buildSeries = (
      label: string,
      baseValue: number,
      stepVolatility: number,
      decimals: number,
    ): PredictiveSeries => {
      let value = baseValue;
      const points = Array.from({ length: pointCount }, (_, i) => {
        // Small random-walk step (with a slight upward drift) so the series trends
        // smoothly instead of looking like pure noise.
        value += (Math.random() - 0.45) * stepVolatility;
        value = Math.max(0, value);
        const pointDate = new Date(now.getFullYear(), now.getMonth() - (pointCount - 1 - i), 1);
        return {
          date: pointDate.toISOString().slice(0, 10),
          value: Number(value.toFixed(decimals)),
        };
      });
      return { label, points };
    };

    return [
      buildSeries('Projected Revenue', 50000, 4000, 2),
      buildSeries('Projected Inventory Turnover', 4, 0.4, 2),
    ];
  }
}

export const aiForecastingEngine: AiForecastingEngine = new FakeAiForecastingEngine();
