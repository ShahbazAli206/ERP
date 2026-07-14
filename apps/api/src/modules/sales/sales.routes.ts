import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { invoicesController } from './invoices.controller';
import { returnsController } from './returns.controller';
import { salesOrdersController } from './salesOrders.controller';

export const salesRoutes = Router();

salesRoutes.use(authenticate);

/**
 * @openapi
 * /sales/orders:
 *   get:
 *     tags: [Sales]
 *     summary: List sales orders (paginated, filterable by status/distributor)
 *     responses: { 200: { description: Paginated sales order list } }
 *   post:
 *     tags: [Sales]
 *     summary: Create a sales order (starts in DRAFT status)
 *     responses: { 201: { description: Sales order created } }
 */
salesRoutes
  .route('/orders')
  .get(requirePermission('sales:view'), salesOrdersController.list)
  .post(requirePermission('sales:create'), salesOrdersController.create);

/**
 * @openapi
 * /sales/orders/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get sales order detail (items with computed pricing, timeline)
 *     responses: { 200: { description: Sales order detail } }
 *   patch:
 *     tags: [Sales]
 *     summary: Edit a sales order (only while DRAFT)
 *     responses: { 200: { description: Sales order updated } }
 *   delete:
 *     tags: [Sales]
 *     summary: Delete a sales order (only while DRAFT)
 *     responses: { 204: { description: Sales order deleted } }
 */
salesRoutes
  .route('/orders/:id')
  .get(requirePermission('sales:view'), salesOrdersController.getDetail)
  .patch(requirePermission('sales:edit'), salesOrdersController.update)
  .delete(requirePermission('sales:edit'), salesOrdersController.remove);

/**
 * @openapi
 * /sales/orders/{id}/confirm:
 *   post:
 *     tags: [Sales]
 *     summary: Confirm a DRAFT order — consumes stock FIFO from the given warehouse
 *     responses: { 200: { description: Order confirmed, stock consumed } }
 */
salesRoutes.post(
  '/orders/:id/confirm',
  requirePermission('sales:edit'),
  salesOrdersController.confirm,
);

/**
 * @openapi
 * /sales/orders/{id}/advance:
 *   post:
 *     tags: [Sales]
 *     summary: Advance order status one step (CONFIRMED→PROCESSING→SHIPPED→DELIVERED)
 *     responses: { 200: { description: Order status advanced } }
 */
salesRoutes.post(
  '/orders/:id/advance',
  requirePermission('sales:edit'),
  salesOrdersController.advance,
);

/**
 * @openapi
 * /sales/orders/{id}/cancel:
 *   post:
 *     tags: [Sales]
 *     summary: Cancel an order (reverses any consumed stock if already confirmed)
 *     responses: { 200: { description: Order cancelled } }
 */
salesRoutes.post(
  '/orders/:id/cancel',
  requirePermission('sales:edit'),
  salesOrdersController.cancel,
);

/**
 * @openapi
 * /sales/invoices:
 *   get:
 *     tags: [Sales]
 *     summary: List invoices (paginated, filterable by status)
 *     responses: { 200: { description: Paginated invoice list } }
 *   post:
 *     tags: [Sales]
 *     summary: Generate an invoice for a confirmed-or-later sales order
 *     responses: { 201: { description: Invoice created } }
 */
salesRoutes
  .route('/invoices')
  .get(requirePermission('sales:view'), invoicesController.list)
  .post(requirePermission('sales:create'), invoicesController.create);

/**
 * @openapi
 * /sales/invoices/{id}:
 *   get:
 *     tags: [Sales]
 *     summary: Get invoice detail (payments, credit notes, balance due)
 *     responses: { 200: { description: Invoice detail } }
 */
salesRoutes.get('/invoices/:id', requirePermission('sales:view'), invoicesController.getDetail);

/**
 * @openapi
 * /sales/invoices/{id}/payments:
 *   post:
 *     tags: [Sales]
 *     summary: Record a payment against an invoice
 *     responses: { 201: { description: Payment recorded } }
 */
salesRoutes.post(
  '/invoices/:id/payments',
  requirePermission('sales:edit'),
  invoicesController.recordPayment,
);

/**
 * @openapi
 * /sales/returns:
 *   get:
 *     tags: [Sales]
 *     summary: List sales returns
 *     responses: { 200: { description: Return list } }
 *   post:
 *     tags: [Sales]
 *     summary: Record a return against a shipped/delivered order (optionally restocking)
 *     responses: { 201: { description: Return recorded } }
 */
salesRoutes
  .route('/returns')
  .get(requirePermission('sales:view'), returnsController.list)
  .post(requirePermission('sales:edit'), returnsController.create);

/**
 * @openapi
 * /sales/credit-notes:
 *   get:
 *     tags: [Sales]
 *     summary: List credit notes
 *     responses: { 200: { description: Credit note list } }
 *   post:
 *     tags: [Sales]
 *     summary: Issue a credit note (from a return, or standalone against an invoice)
 *     responses: { 201: { description: Credit note issued } }
 */
salesRoutes
  .route('/credit-notes')
  .get(requirePermission('sales:view'), returnsController.listCreditNotes)
  .post(requirePermission('sales:edit'), returnsController.createCreditNote);
