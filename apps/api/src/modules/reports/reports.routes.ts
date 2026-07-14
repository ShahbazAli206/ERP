import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { reportsController } from './reports.controller';

/**
 * Reports (Phase 3.11) — pure aggregation/read endpoints for the 9 report types in
 * IMPLEMENTATION_PLAN.md. Like Dashboard, this module owns no calculation itself where another
 * module already computes the same number:
 *   - Profit and Cash Flow proxy Finance's reports.service.ts directly.
 *   - Expense Report proxies Expenses' own report().
 *   - Tax Report is built on Tax's compliance-dashboard aggregate, plus a per-tax-type
 *     breakdown computed with that same estimate formula.
 *   - Supplier/Distributor Report reuse the Suppliers/Distributors modules' own
 *     outstanding-balance and committed-value calculations (never a hand-summed total).
 *   - Sales Report and Purchase Report are newly written here (no other module exposes a flat,
 *     paginated order listing with a real total) but still delegate the per-order total to
 *     shared/pricing.ts's orderTotal() for sales, or the simple quantity*unitPrice sum for
 *     purchases (POs carry no discount/pricing-group math).
 *
 * PDF/Excel export and print-friendly formatting are explicitly out of scope here (Phase 9) —
 * every endpoint below returns structured JSON only. All 6 demo roles have at least
 * `reports:view`, so a single router-level permission check (rather than per-route, as
 * Finance/Expenses/Tax do for their create/edit/delete routes) is sufficient — this module has
 * no mutating endpoints at all.
 */
export const reportsRoutes = Router();

reportsRoutes.use(authenticate);
reportsRoutes.use(requirePermission('reports:view'));

/**
 * @openapi
 * /reports/sales:
 *   get:
 *     tags: [Reports]
 *     summary: Paginated sales-order listing for a date range with real totals (shared pricing calculator), plus a grand-total/status-breakdown summary over the whole filtered range
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: distributorId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses: { 200: { description: Sales report } }
 */
reportsRoutes.get('/sales', reportsController.sales);

/**
 * @openapi
 * /reports/purchases:
 *   get:
 *     tags: [Reports]
 *     summary: Paginated purchase-order listing for a date range with totals, plus a grand-total/status-breakdown summary over the whole filtered range
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: supplierId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses: { 200: { description: Purchase report } }
 */
reportsRoutes.get('/purchases', reportsController.purchases);

/**
 * @openapi
 * /reports/inventory:
 *   get:
 *     tags: [Reports]
 *     summary: Inventory valuation per product (Inventory's own valuation()) merged with low-stock and expiring-soon flags
 *     parameters:
 *       - in: query
 *         name: warehouseId
 *         schema: { type: string }
 *       - in: query
 *         name: expiryWithinDays
 *         schema: { type: integer, default: 30 }
 *     responses: { 200: { description: Inventory report } }
 */
reportsRoutes.get('/inventory', reportsController.inventory);

/**
 * @openapi
 * /reports/profit:
 *   get:
 *     tags: [Reports]
 *     summary: Income, COGS, expenses and net profit for a date range (proxies Finance's profit & loss report)
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses: { 200: { description: Profit report } }
 */
reportsRoutes.get('/profit', reportsController.profit);

/**
 * @openapi
 * /reports/cash-flow:
 *   get:
 *     tags: [Reports]
 *     summary: Incoming/outgoing payment totals with a day-by-day breakdown (proxies Finance's cash flow report)
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses: { 200: { description: Cash flow report } }
 */
reportsRoutes.get('/cash-flow', reportsController.cashFlow);

/**
 * @openapi
 * /reports/suppliers:
 *   get:
 *     tags: [Reports]
 *     summary: Full listing of all suppliers with committed purchase value, outstanding balance and purchase-order count
 *     responses: { 200: { description: Supplier report } }
 */
reportsRoutes.get('/suppliers', reportsController.suppliers);

/**
 * @openapi
 * /reports/distributors:
 *   get:
 *     tags: [Reports]
 *     summary: Full listing of all distributors with committed sales value, outstanding balance and sales-order count
 *     responses: { 200: { description: Distributor report } }
 */
reportsRoutes.get('/distributors', reportsController.distributors);

/**
 * @openapi
 * /reports/expenses:
 *   get:
 *     tags: [Reports]
 *     summary: Expense totals grouped by category for a date range (proxies Expenses' own report)
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses: { 200: { description: Expense report } }
 */
reportsRoutes.get('/expenses', reportsController.expenses);

/**
 * @openapi
 * /reports/tax:
 *   get:
 *     tags: [Reports]
 *     summary: Tax compliance aggregate (Tax's own compliance-dashboard) plus a per-tax-type estimated liability breakdown
 *     responses: { 200: { description: Tax report } }
 */
reportsRoutes.get('/tax', reportsController.tax);
