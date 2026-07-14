import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { aiController } from './ai.controller';

/**
 * AI Dashboard — Demo Only.
 *
 * This module does NOT integrate any real AI/ML service. It exposes read-only,
 * placeholder endpoints for a demo "AI Dashboard": some are real aggregations over
 * existing sales/inventory data (best-selling products, slow-moving inventory), and
 * the rest return generated demo data (demand forecast, seasonal analysis, import
 * recommendations, predictive charts) intended purely to populate demo charts.
 */
export const aiRoutes = Router();

aiRoutes.use(authenticate);

/**
 * @openapi
 * /ai/best-selling-products:
 *   get:
 *     tags: [AI]
 *     summary: Top 10 best-selling products by quantity sold on delivered orders (real aggregation)
 *     responses:
 *       200: { description: Best-selling products }
 */
aiRoutes.get(
  '/best-selling-products',
  requirePermission('ai:view'),
  aiController.bestSellingProducts,
);

/**
 * @openapi
 * /ai/slow-moving-inventory:
 *   get:
 *     tags: [AI]
 *     summary: In-stock products with no recent sale activity (real aggregation)
 *     responses:
 *       200: { description: Slow-moving inventory }
 */
aiRoutes.get(
  '/slow-moving-inventory',
  requirePermission('ai:view'),
  aiController.slowMovingInventory,
);

/**
 * @openapi
 * /ai/demand-forecast:
 *   get:
 *     tags: [AI]
 *     summary: Demo-only generated 6-month demand forecast for a sample of real products
 *     responses:
 *       200: { description: Demand forecast (demo data) }
 */
aiRoutes.get('/demand-forecast', requirePermission('ai:view'), aiController.demandForecast);

/**
 * @openapi
 * /ai/seasonal-analysis:
 *   get:
 *     tags: [AI]
 *     summary: Demo-only generated seasonal index per calendar month
 *     responses:
 *       200: { description: Seasonal analysis (demo data) }
 */
aiRoutes.get('/seasonal-analysis', requirePermission('ai:view'), aiController.seasonalAnalysis);

/**
 * @openapi
 * /ai/import-recommendation:
 *   get:
 *     tags: [AI]
 *     summary: Demo-only generated import/reorder recommendations for a sample of real products
 *     responses:
 *       200: { description: Import recommendations (demo data) }
 */
aiRoutes.get(
  '/import-recommendation',
  requirePermission('ai:view'),
  aiController.importRecommendation,
);

/**
 * @openapi
 * /ai/predictive-charts:
 *   get:
 *     tags: [AI]
 *     summary: Demo-only generated time series for predictive line charts
 *     responses:
 *       200: { description: Predictive chart series (demo data) }
 */
aiRoutes.get('/predictive-charts', requirePermission('ai:view'), aiController.predictiveCharts);
