import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { upload } from '../../middleware/upload.middleware';
import { procurementController } from './procurement.controller';

export const procurementRoutes = Router();

procurementRoutes.use(authenticate);

/**
 * @openapi
 * /procurement/purchase-orders:
 *   get:
 *     tags: [Procurement]
 *     summary: List purchase orders (paginated, filterable by status/supplier)
 *     responses:
 *       200: { description: Paginated purchase order list }
 *   post:
 *     tags: [Procurement]
 *     summary: Create a purchase order (starts in DRAFT status)
 *     responses:
 *       201: { description: Purchase order created }
 */
procurementRoutes
  .route('/purchase-orders')
  .get(requirePermission('procurement:view'), procurementController.list)
  .post(requirePermission('procurement:create'), procurementController.create);

/**
 * @openapi
 * /procurement/purchase-orders/{id}:
 *   get:
 *     tags: [Procurement]
 *     summary: Get full purchase order detail (items, supplier, attachments, status history)
 *     responses:
 *       200: { description: Purchase order detail }
 *   patch:
 *     tags: [Procurement]
 *     summary: Edit a purchase order (only while status is DRAFT)
 *     responses:
 *       200: { description: Purchase order updated }
 *   delete:
 *     tags: [Procurement]
 *     summary: Delete a purchase order (only while status is DRAFT)
 *     responses:
 *       204: { description: Purchase order deleted }
 */
procurementRoutes
  .route('/purchase-orders/:id')
  .get(requirePermission('procurement:view'), procurementController.getDetail)
  .patch(requirePermission('procurement:edit'), procurementController.update)
  .delete(requirePermission('procurement:edit'), procurementController.deleteDraft);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/submit:
 *   post:
 *     tags: [Procurement]
 *     summary: Submit a DRAFT purchase order for approval
 *     responses:
 *       200: { description: Purchase order moved to PENDING_APPROVAL }
 */
procurementRoutes.post(
  '/purchase-orders/:id/submit',
  requirePermission('procurement:edit'),
  procurementController.submit,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/approve:
 *   post:
 *     tags: [Procurement]
 *     summary: Approve a purchase order pending approval
 *     responses:
 *       200: { description: Purchase order approved }
 */
procurementRoutes.post(
  '/purchase-orders/:id/approve',
  requirePermission('procurement:approve'),
  procurementController.approve,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/reject:
 *   post:
 *     tags: [Procurement]
 *     summary: Reject a purchase order pending approval
 *     responses:
 *       200: { description: Purchase order rejected }
 */
procurementRoutes.post(
  '/purchase-orders/:id/reject',
  requirePermission('procurement:approve'),
  procurementController.reject,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/mark-ordered:
 *   post:
 *     tags: [Procurement]
 *     summary: Mark an approved purchase order as placed with the supplier
 *     responses:
 *       200: { description: Purchase order marked ORDERED }
 */
procurementRoutes.post(
  '/purchase-orders/:id/mark-ordered',
  requirePermission('procurement:edit'),
  procurementController.markOrdered,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/cancel:
 *   post:
 *     tags: [Procurement]
 *     summary: Cancel a purchase order (not allowed once received)
 *     responses:
 *       200: { description: Purchase order cancelled }
 */
procurementRoutes.post(
  '/purchase-orders/:id/cancel',
  requirePermission('procurement:edit'),
  procurementController.cancel,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/attachments:
 *   post:
 *     tags: [Procurement]
 *     summary: Upload an attachment to a purchase order
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
procurementRoutes.post(
  '/purchase-orders/:id/attachments',
  requirePermission('procurement:edit'),
  upload.single('file'),
  procurementController.uploadAttachment,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/attachments/{attachmentId}/download:
 *   get:
 *     tags: [Procurement]
 *     summary: Download a purchase order attachment
 *     responses:
 *       200: { description: File stream }
 */
procurementRoutes.get(
  '/purchase-orders/:id/attachments/:attachmentId/download',
  requirePermission('procurement:view'),
  procurementController.downloadAttachment,
);

/**
 * @openapi
 * /procurement/purchase-orders/{id}/attachments/{attachmentId}:
 *   delete:
 *     tags: [Procurement]
 *     summary: Remove a purchase order attachment
 *     responses:
 *       204: { description: Attachment removed }
 */
procurementRoutes.delete(
  '/purchase-orders/:id/attachments/:attachmentId',
  requirePermission('procurement:edit'),
  procurementController.removeAttachment,
);
