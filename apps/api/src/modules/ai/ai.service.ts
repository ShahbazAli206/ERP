import { aiForecastingEngine } from '../../shared/integrations/aiForecasting.service';
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
  // Generation logic lives behind the AiForecastingEngine abstraction (Phase 4) — this
  // service only fetches the real candidate product pool and delegates the fake number
  // generation to it.

  async demandForecast(): Promise<DemandForecastProductDto[]> {
    const pool = await aiRepository.sampleProductPool(20);
    return aiForecastingEngine.forecastDemand(pool);
  },

  seasonalAnalysis(): SeasonalIndexDto[] {
    return aiForecastingEngine.seasonalAnalysis();
  },

  async importRecommendation(): Promise<ImportRecommendationDto[]> {
    const pool = await aiRepository.sampleProductPool(20);
    return aiForecastingEngine.recommendImports(pool);
  },

  predictiveCharts(): PredictiveChartSeriesDto[] {
    return aiForecastingEngine.predictiveCharts();
  },
};
