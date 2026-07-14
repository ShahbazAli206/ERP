import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { shipmentsController } from './shipments.controller';

export const shipmentsRoutes = Router();

shipmentsRoutes.use(authenticate);

/**
 * @openapi
 * /shipments:
 *   get:
 *     tags: [Shipments]
 *     summary: List shipments (paginated, filterable by status/purchaseOrderId)
 *     responses:
 *       200: { description: Paginated shipment list }
 *   post:
 *     tags: [Shipments]
 *     summary: Create a shipment (optionally linked to a purchase order)
 *     responses:
 *       201: { description: Shipment created }
 */
shipmentsRoutes
  .route('/')
  .get(requirePermission('shipments:view'), shipmentsController.list)
  .post(requirePermission('shipments:create'), shipmentsController.create);

/**
 * @openapi
 * /shipments/{id}:
 *   get:
 *     tags: [Shipments]
 *     summary: Get shipment detail (items, timeline, landed cost summary)
 *     responses:
 *       200: { description: Shipment detail }
 *   patch:
 *     tags: [Shipments]
 *     summary: Edit shipment details (not allowed once DELIVERED)
 *     responses:
 *       200: { description: Shipment updated }
 *   delete:
 *     tags: [Shipments]
 *     summary: Delete a shipment (only while still BOOKED)
 *     responses:
 *       204: { description: Shipment deleted }
 */
shipmentsRoutes
  .route('/:id')
  .get(requirePermission('shipments:view'), shipmentsController.getDetail)
  .patch(requirePermission('shipments:edit'), shipmentsController.update)
  .delete(requirePermission('shipments:delete'), shipmentsController.remove);

/**
 * @openapi
 * /shipments/{id}/status:
 *   post:
 *     tags: [Shipments]
 *     summary: Transition shipment status (tracking update)
 *     responses:
 *       200: { description: Shipment status updated }
 */
shipmentsRoutes.post(
  '/:id/status',
  requirePermission('shipments:edit'),
  shipmentsController.updateStatus,
);
