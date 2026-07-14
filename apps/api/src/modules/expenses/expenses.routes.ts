import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { upload } from '../../middleware/upload.middleware';
import { expenseCategoriesController } from './expenseCategories.controller';
import { expensesController } from './expenses.controller';

export const expensesRoutes = Router();

expensesRoutes.use(authenticate);

/**
 * @openapi
 * /expenses/categories:
 *   get:
 *     tags: [Expenses]
 *     summary: List expense categories
 *     responses:
 *       200: { description: Expense category list }
 *   post:
 *     tags: [Expenses]
 *     summary: Create an expense category
 *     responses:
 *       201: { description: Expense category created }
 */
expensesRoutes
  .route('/categories')
  .get(requirePermission('expenses:view'), expenseCategoriesController.list)
  .post(requirePermission('expenses:create'), expenseCategoriesController.create);

/**
 * @openapi
 * /expenses/categories/{id}:
 *   patch:
 *     tags: [Expenses]
 *     summary: Update an expense category
 *     responses:
 *       200: { description: Expense category updated }
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete an expense category (blocked if expenses reference it)
 *     responses:
 *       204: { description: Expense category deleted }
 *       409: { description: Category still has expenses recorded against it }
 */
expensesRoutes
  .route('/categories/:id')
  .patch(requirePermission('expenses:edit'), expenseCategoriesController.update)
  .delete(requirePermission('expenses:delete'), expenseCategoriesController.remove);

/**
 * @openapi
 * /expenses/report:
 *   get:
 *     tags: [Expenses]
 *     summary: Expense totals grouped by category for a date range
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Expense report grouped by category }
 */
expensesRoutes.get('/report', requirePermission('expenses:view'), expensesController.report);

/**
 * @openapi
 * /expenses:
 *   get:
 *     tags: [Expenses]
 *     summary: List expenses (paginated, filterable by category/date range, searchable by description)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated expense list }
 *   post:
 *     tags: [Expenses]
 *     summary: Record an expense
 *     responses:
 *       201: { description: Expense created }
 */
expensesRoutes
  .route('/')
  .get(requirePermission('expenses:view'), expensesController.list)
  .post(requirePermission('expenses:create'), expensesController.create);

/**
 * @openapi
 * /expenses/{id}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get expense detail (including attachments)
 *     responses:
 *       200: { description: Expense detail }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Expenses]
 *     summary: Update an expense
 *     responses:
 *       200: { description: Expense updated }
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete an expense (also removes its attachments)
 *     responses:
 *       204: { description: Expense deleted }
 */
expensesRoutes
  .route('/:id')
  .get(requirePermission('expenses:view'), expensesController.getDetail)
  .patch(requirePermission('expenses:edit'), expensesController.update)
  .delete(requirePermission('expenses:delete'), expensesController.remove);

/**
 * @openapi
 * /expenses/{id}/attachments:
 *   post:
 *     tags: [Expenses]
 *     summary: Upload an attachment to an expense
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Attachment uploaded }
 */
expensesRoutes.post(
  '/:id/attachments',
  requirePermission('expenses:edit'),
  upload.single('file'),
  expensesController.uploadAttachment,
);

/**
 * @openapi
 * /expenses/{id}/attachments/{attachmentId}/download:
 *   get:
 *     tags: [Expenses]
 *     summary: Download an expense attachment
 *     responses:
 *       200: { description: File stream }
 */
expensesRoutes.get(
  '/:id/attachments/:attachmentId/download',
  requirePermission('expenses:view'),
  expensesController.downloadAttachment,
);

/**
 * @openapi
 * /expenses/{id}/attachments/{attachmentId}:
 *   delete:
 *     tags: [Expenses]
 *     summary: Remove an expense attachment
 *     responses:
 *       204: { description: Attachment removed }
 */
expensesRoutes.delete(
  '/:id/attachments/:attachmentId',
  requirePermission('expenses:delete'),
  expensesController.removeAttachment,
);
