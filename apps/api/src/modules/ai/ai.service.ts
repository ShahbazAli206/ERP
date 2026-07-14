import { aiRepository } from './ai.repository';
import type {
  BestSellingProductDto,
  DemandForecastProductDto,
  ImportRecommendationDto,
  PredictiveChartSeriesDto,
  SeasonalIndexDto,
  SlowMovingInventoryItemDto,
} from './ai.dto';

const SLOW_MOVING_THRESHOLD_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

export const aiService = {
  // ===== Real, computed data =====

  async bestSellingProducts(): Promise<BestSellingProductDto[]> {
    const totals = await aiRepository.topSellingProductTotals(10);
    const products = await aiRepository.productsByIds(totals.map((t) => t.productId));
    const productById = new Map(products.map((p) => [p.id, p]));

    return totals.flatMap((t) => {
      const product = productById.get(t.productId);
      if (!product) return [];
      return [
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantitySold: t._sum.quantity ?? 0,
        },
      ];
    });
  },

  async slowMovingInventory(): Promise<SlowMovingInventoryItemDto[]> {
    const [products, stockByProduct, lastSaleByProduct] = await Promise.all([
      aiRepository.activeProducts(),
      aiRepository.stockOnHandByProduct(),
      aiRepository.lastSaleDateByProduct(),
    ]);

    const cutoff = new Date(Date.now() - SLOW_MOVING_THRESHOLD_DAYS * MS_PER_DAY);

    return products
      .map((p) => {
        const stockOnHand = stockByProduct.get(p.id) ?? 0;
        const lastSaleDate = lastSaleByProduct.get(p.id) ?? null;
        return { productId: p.id, sku: p.sku, name: p.name, stockOnHand, lastSaleDate };
      })
      .filter((p) => p.stockOnHand > 0 && (p.lastSaleDate === null || p.lastSaleDate < cutoff));
  },

  // ===== Demo-only, generated placeholder data (AI Dashboard is explicitly demo-only) =====

  async demandForecast(): Promise<DemandForecastProductDto[]> {
    const pool = await aiRepository.sampleProductPool(20);
    const pickCount = Math.min(pool.length, randomInt(3, 5));
    const chosen = shuffled(pool).slice(0, pickCount);
    const now = new Date();

    return chosen.map((product) => ({
      productId: product.id,
      productName: product.name,
      forecast: Array.from({ length: 6 }, (_, i) => {
        const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        return { month: monthLabel(monthDate), predictedDemand: randomInt(50, 500) };
      }),
    }));
  },

  seasonalAnalysis(): SeasonalIndexDto[] {
    return MONTH_NAMES.map((month) => ({
      month,
      seasonalIndex: Number((0.5 + Math.random()).toFixed(2)),
    }));
  },

  async importRecommendation(): Promise<ImportRecommendationDto[]> {
    const pool = await aiRepository.sampleProductPool(20);
    const pickCount = Math.min(pool.length, randomInt(3, 5));
    const chosen = shuffled(pool).slice(0, pickCount);

    return chosen.map((product) => ({
      productName: product.name,
      recommendedOrderQuantity: randomInt(50, 500),
      reason: IMPORT_REASONS[randomInt(0, IMPORT_REASONS.length - 1)],
    }));
  },

  predictiveCharts(): PredictiveChartSeriesDto[] {
    const now = new Date();
    const pointCount = 12;

    const buildSeries = (
      label: string,
      baseValue: number,
      stepVolatility: number,
      decimals: number,
    ): PredictiveChartSeriesDto => {
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
  },
};
