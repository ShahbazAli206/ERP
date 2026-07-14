import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { suppliersController } from './suppliers.controller';

export const suppliersRoutes = Router();

suppliersRoutes.use(authenticate);

/**
 * @openapi
 * /suppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: List suppliers (paginated, filterable, searchable)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: [true, false] }
 *     responses:
 *       200: { description: Paginated supplier list }
 *   post:
 *     tags: [Suppliers]
 *     summary: Create a supplier
 *     responses:
 *       201: { description: Supplier created }
 */
suppliersRoutes
  .route('/')
  .get(requirePermission('suppliers:view'), suppliersController.list)
  .post(requirePermission('suppliers:create'), suppliersController.create);

/**
 * @openapi
 * /suppliers/{id}:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get a supplier's full profile (contacts, products, purchase history, balance)
 *     responses:
 *       200: { description: Supplier profile }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Suppliers]
 *     summary: Update a supplier
 *     responses:
 *       200: { description: Supplier updated }
 *   delete:
 *     tags: [Suppliers]
 *     summary: Deactivate a supplier (soft delete)
 *     responses:
 *       204: { description: Supplier deactivated }
 */
suppliersRoutes
  .route('/:id')
  .get(requirePermission('suppliers:view'), suppliersController.getProfile)
  .patch(requirePermission('suppliers:edit'), suppliersController.update)
  .delete(requirePermission('suppliers:delete'), suppliersController.deactivate);

/**
 * @openapi
 * /suppliers/{id}/contacts:
 *   post:
 *     tags: [Suppliers]
 *     summary: Add a contact to a supplier
 *     responses:
 *       201: { description: Contact added }
 */
suppliersRoutes.post(
  '/:id/contacts',
  requirePermission('suppliers:edit'),
  suppliersController.addContact,
);

/**
 * @openapi
 * /suppliers/{id}/contacts/{contactId}:
 *   delete:
 *     tags: [Suppliers]
 *     summary: Remove a supplier contact
 *     responses:
 *       204: { description: Contact removed }
 */
suppliersRoutes.delete(
  '/:id/contacts/:contactId',
  requirePermission('suppliers:edit'),
  suppliersController.removeContact,
);
