import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { distributorsController } from './distributors.controller';
import { pricingGroupsController } from './pricingGroups.controller';

export const distributorsRoutes = Router();

distributorsRoutes.use(authenticate);

/**
 * @openapi
 * /distributors/pricing-groups:
 *   get:
 *     tags: [Distributors]
 *     summary: List pricing groups
 *     responses: { 200: { description: Pricing group list } }
 *   post:
 *     tags: [Distributors]
 *     summary: Create a pricing group
 *     responses: { 201: { description: Pricing group created } }
 */
distributorsRoutes
  .route('/pricing-groups')
  .get(requirePermission('distributors:view'), pricingGroupsController.list)
  .post(requirePermission('distributors:create'), pricingGroupsController.create);

distributorsRoutes
  .route('/pricing-groups/:id')
  .patch(requirePermission('distributors:edit'), pricingGroupsController.update)
  .delete(requirePermission('distributors:delete'), pricingGroupsController.remove);

/**
 * @openapi
 * /distributors:
 *   get:
 *     tags: [Distributors]
 *     summary: List distributors (paginated, filterable, searchable)
 *     responses: { 200: { description: Paginated distributor list } }
 *   post:
 *     tags: [Distributors]
 *     summary: Create a distributor
 *     responses: { 201: { description: Distributor created } }
 */
distributorsRoutes
  .route('/')
  .get(requirePermission('distributors:view'), distributorsController.list)
  .post(requirePermission('distributors:create'), distributorsController.create);

/**
 * @openapi
 * /distributors/{id}:
 *   get:
 *     tags: [Distributors]
 *     summary: Get distributor profile (pricing group, outstanding balance, sales/payment history)
 *     responses: { 200: { description: Distributor profile } }
 *   patch:
 *     tags: [Distributors]
 *     summary: Update a distributor
 *     responses: { 200: { description: Distributor updated } }
 *   delete:
 *     tags: [Distributors]
 *     summary: Deactivate a distributor (soft delete)
 *     responses: { 204: { description: Distributor deactivated } }
 */
distributorsRoutes
  .route('/:id')
  .get(requirePermission('distributors:view'), distributorsController.getProfile)
  .patch(requirePermission('distributors:edit'), distributorsController.update)
  .delete(requirePermission('distributors:delete'), distributorsController.deactivate);
