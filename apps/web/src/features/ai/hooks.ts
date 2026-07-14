'use client';

import { useQuery } from '@tanstack/react-query';
import { aiApi } from './api';

const AI_BEST_SELLING_KEY = ['ai', 'best-selling-products'] as const;
const AI_SLOW_MOVING_KEY = ['ai', 'slow-moving-inventory'] as const;
const AI_DEMAND_FORECAST_KEY = ['ai', 'demand-forecast'] as const;
const AI_SEASONAL_ANALYSIS_KEY = ['ai', 'seasonal-analysis'] as const;
const AI_IMPORT_RECOMMENDATION_KEY = ['ai', 'import-recommendation'] as const;
const AI_PREDICTIVE_CHARTS_KEY = ['ai', 'predictive-charts'] as const;

/** Demo-generated endpoints return a freshly randomized payload on every hit (see
 * `aiForecasting.service.ts`) — a short `staleTime` keeps a section's numbers stable while the
 * user is looking at the page instead of visibly reshuffling on every window refocus/remount. */
const DEMO_STALE_TIME_MS = 5 * 60_000;

export function useBestSellingProducts() {
  return useQuery({ queryKey: AI_BEST_SELLING_KEY, queryFn: () => aiApi.bestSellingProducts() });
}

export function useSlowMovingInventory() {
  return useQuery({ queryKey: AI_SLOW_MOVING_KEY, queryFn: () => aiApi.slowMovingInventory() });
}

export function useDemandForecast() {
  return useQuery({
    queryKey: AI_DEMAND_FORECAST_KEY,
    queryFn: () => aiApi.demandForecast(),
    staleTime: DEMO_STALE_TIME_MS,
  });
}

export function useSeasonalAnalysis() {
  return useQuery({
    queryKey: AI_SEASONAL_ANALYSIS_KEY,
    queryFn: () => aiApi.seasonalAnalysis(),
    staleTime: DEMO_STALE_TIME_MS,
  });
}

export function useImportRecommendation() {
  return useQuery({
    queryKey: AI_IMPORT_RECOMMENDATION_KEY,
    queryFn: () => aiApi.importRecommendation(),
    staleTime: DEMO_STALE_TIME_MS,
  });
}

export function usePredictiveCharts() {
  return useQuery({
    queryKey: AI_PREDICTIVE_CHARTS_KEY,
    queryFn: () => aiApi.predictiveCharts(),
    staleTime: DEMO_STALE_TIME_MS,
  });
}
