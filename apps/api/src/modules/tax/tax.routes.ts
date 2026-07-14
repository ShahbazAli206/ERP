import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { taxController } from './tax.controller';

export const taxRoutes = Router();

taxRoutes.use(authenticate);

/**
 * @openapi
 * /tax/compliance-dashboard:
 *   get:
 *     tags: [Tax]
 *     summary: Simplified tax compliance dashboard aggregate
 *     responses:
 *       200: { description: Compliance dashboard aggregate }
 */
taxRoutes.get(
  '/compliance-dashboard',
  requirePermission('tax:view'),
  taxController.complianceDashboard,
);

/**
 * @openapi
 * /tax/e-invoice:
 *   get:
 *     tags: [Tax]
 *     summary: FBR e-Invoicing placeholder (not integrated in this demo)
 *     responses:
 *       200: { description: Static placeholder response }
 */
taxRoutes.get('/e-invoice', requirePermission('tax:view'), taxController.eInvoice);

/**
 * @openapi
 * /tax/audit-logs:
 *   get:
 *     tags: [Tax]
 *     summary: List audit log entries (paginated, most recent first)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated audit log list }
 */
taxRoutes.get('/audit-logs', requirePermission('tax:view'), taxController.auditLogs);

/**
 * @openapi
 * /tax:
 *   get:
 *     tags: [Tax]
 *     summary: List taxes (paginated, filterable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [GST, SALES_TAX, WITHHOLDING_TAX] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200: { description: Paginated tax list }
 *   post:
 *     tags: [Tax]
 *     summary: Create a tax
 *     responses:
 *       201: { description: Tax created }
 */
taxRoutes
  .route('/')
  .get(requirePermission('tax:view'), taxController.list)
  .post(requirePermission('tax:create'), taxController.create);

/**
 * @openapi
 * /tax/{id}:
 *   patch:
 *     tags: [Tax]
 *     summary: Update a tax
 *     responses:
 *       200: { description: Tax updated }
 *   delete:
 *     tags: [Tax]
 *     summary: Delete a tax
 *     responses:
 *       204: { description: Tax deleted }
 */
taxRoutes
  .route('/:id')
  .patch(requirePermission('tax:edit'), taxController.update)
  .delete(requirePermission('tax:delete'), taxController.remove);
