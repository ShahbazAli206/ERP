import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { notificationsController } from './notifications.controller';

export const notificationsRoutes = Router();

notificationsRoutes.use(authenticate);

// Reading/marking-read only ever touches the caller's own notifications (enforced by
// ownership checks in the service layer), so — unlike every other module here — these
// don't gate on a role permission. Every authenticated user manages their own inbox
// regardless of role; only creating a notification for someone else is permission-gated.

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications for the current user (paginated, filterable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: isRead
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [IN_APP, EMAIL, SMS, WHATSAPP, PUSH] }
 *     responses:
 *       200: { description: Paginated notification list for the current user }
 *   post:
 *     tags: [Notifications]
 *     summary: Create a notification (admin/internal use)
 *     responses:
 *       201: { description: Notification created }
 */
notificationsRoutes
  .route('/')
  .get(notificationsController.list)
  .post(requirePermission('notifications:create'), notificationsController.create);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get the count of unread notifications for the current user
 *     responses:
 *       200: { description: Unread notification count }
 */
notificationsRoutes.get('/unread-count', notificationsController.unreadCount);

/**
 * @openapi
 * /notifications/mark-all-read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all of the current user's notifications as read
 *     responses:
 *       200: { description: Notifications marked as read }
 */
notificationsRoutes.post('/mark-all-read', notificationsController.markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     responses:
 *       200: { description: Notification marked as read }
 *       404: { description: Not found }
 */
notificationsRoutes.patch('/:id/read', notificationsController.markAsRead);
