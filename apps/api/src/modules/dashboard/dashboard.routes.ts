import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { dashboardController } from './dashboard.controller';

/**
 * Dashboard — aggregated KPIs + chart-data endpoints. This module does not own any
 * calculation itself: every number is pulled from the module that already computes it
 * (Finance's P&L/cash-position/receivables/payables, Inventory's valuation/low-stock,
 * AI's best-selling-products, Distributors' sales-history) so the same figure can never
 * silently disagree between Dashboard and the module that owns it. The few things genuinely
 * local to this module (shipment/PO counts, StatusHistory joins) are plain single-table
 * queries with no risk of divergence.
 */
export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);
dashboardRoutes.use(requirePermission('dashboard:view'));

/**
 * @openapi
 * /dashboard/kpis:
 *   get:
 *     tags: [Dashboard]
 *     summary: Top-level KPI tiles (revenue, profit, cash, inventory value, receivables/payables, alerts)
 *     parameters:
 *       - in: query
 *         name: from
 *         required: false
 *         schema: { type: string, format: date }
 *         description: Defaults to 11 months before the first of the current month
 *       - in: query
 *         name: to
 *         required: false
 *         schema: { type: string, format: date }
 *         description: Defaults to today
 *     responses: { 200: { description: KPI summary } }
 */
dashboardRoutes.get('/kpis', dashboardController.kpis);

/**
 * @openapi
 * /dashboard/charts/revenue-trend:
 *   get:
 *     tags: [Dashboard]
 *     summary: Trailing 12 months of revenue (one point per month)
 *     responses: { 200: { description: Monthly revenue series } }
 */
dashboardRoutes.get('/charts/revenue-trend', dashboardController.revenueTrend);

/**
 * @openapi
 * /dashboard/charts/profit-trend:
 *   get:
 *     tags: [Dashboard]
 *     summary: Trailing 12 months of net profit (one point per month)
 *     responses: { 200: { description: Monthly profit series } }
 */
dashboardRoutes.get('/charts/profit-trend', dashboardController.profitTrend);

/**
 * @openapi
 * /dashboard/charts/inventory-value:
 *   get:
 *     tags: [Dashboard]
 *     summary: Current inventory valuation grouped by product category
 *     responses: { 200: { description: Inventory value per category } }
 */
dashboardRoutes.get('/charts/inventory-value', dashboardController.inventoryValueByCategory);

/**
 * @openapi
 * /dashboard/charts/sales-by-category:
 *   get:
 *     tags: [Dashboard]
 *     summary: Real sales revenue (shared pricing calculator) grouped by product category
 *     parameters:
 *       - in: query
 *         name: from
 *         required: false
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: false
 *         schema: { type: string, format: date }
 *     responses: { 200: { description: Sales revenue per category } }
 */
dashboardRoutes.get('/charts/sales-by-category', dashboardController.salesByCategory);

/**
 * @openapi
 * /dashboard/charts/top-products:
 *   get:
 *     tags: [Dashboard]
 *     summary: Top 10 best-selling products by quantity sold (delegates to the AI module's real aggregation)
 *     responses: { 200: { description: Top-selling products } }
 */
dashboardRoutes.get('/charts/top-products', dashboardController.topProducts);

/**
 * @openapi
 * /dashboard/charts/top-suppliers:
 *   get:
 *     tags: [Dashboard]
 *     summary: Top 10 suppliers by total committed purchase-order value (ORDERED or later)
 *     responses: { 200: { description: Top suppliers by committed spend } }
 */
dashboardRoutes.get('/charts/top-suppliers', dashboardController.topSuppliers);

/**
 * @openapi
 * /dashboard/charts/distributor-performance:
 *   get:
 *     tags: [Dashboard]
 *     summary: Top 10 distributors by total committed sales value (real pricing, not naive unitPrice*quantity)
 *     responses: { 200: { description: Top distributors by sales value } }
 */
dashboardRoutes.get('/charts/distributor-performance', dashboardController.distributorPerformance);

/**
 * @openapi
 * /dashboard/charts/recent-activities:
 *   get:
 *     tags: [Dashboard]
 *     summary: Latest ~20 status-change events across purchase orders, shipments and sales orders
 *     responses: { 200: { description: Recent activity feed } }
 */
dashboardRoutes.get('/charts/recent-activities', dashboardController.recentActivities);
