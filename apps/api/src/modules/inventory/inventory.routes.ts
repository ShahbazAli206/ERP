import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { categoriesController } from './categories.controller';
import { productsController } from './products.controller';
import { stockController } from './stock.controller';
import { warehousesController } from './warehouses.controller';

export const inventoryRoutes = Router();

inventoryRoutes.use(authenticate);

/**
 * @openapi
 * /inventory/categories:
 *   get:
 *     tags: [Inventory]
 *     summary: List product categories
 *     responses: { 200: { description: Category list } }
 *   post:
 *     tags: [Inventory]
 *     summary: Create a category
 *     responses: { 201: { description: Category created } }
 */
inventoryRoutes
  .route('/categories')
  .get(requirePermission('inventory:view'), categoriesController.list)
  .post(requirePermission('inventory:create'), categoriesController.create);

inventoryRoutes
  .route('/categories/:id')
  .patch(requirePermission('inventory:edit'), categoriesController.update)
  .delete(requirePermission('inventory:delete'), categoriesController.remove);

/**
 * @openapi
 * /inventory/warehouses:
 *   get:
 *     tags: [Inventory]
 *     summary: List warehouses
 *     responses: { 200: { description: Warehouse list } }
 *   post:
 *     tags: [Inventory]
 *     summary: Create a warehouse
 *     responses: { 201: { description: Warehouse created } }
 */
inventoryRoutes
  .route('/warehouses')
  .get(requirePermission('inventory:view'), warehousesController.list)
  .post(requirePermission('inventory:create'), warehousesController.create);

inventoryRoutes
  .route('/warehouses/:id')
  .patch(requirePermission('inventory:edit'), warehousesController.update)
  .delete(requirePermission('inventory:delete'), warehousesController.remove);

/**
 * @openapi
 * /inventory/products:
 *   get:
 *     tags: [Inventory]
 *     summary: List products (paginated, searchable by name/SKU/barcode) with computed stock levels
 *     responses: { 200: { description: Paginated product list } }
 *   post:
 *     tags: [Inventory]
 *     summary: Create a product
 *     responses: { 201: { description: Product created } }
 */
inventoryRoutes
  .route('/products')
  .get(requirePermission('inventory:view'), productsController.list)
  .post(requirePermission('inventory:create'), productsController.create);

/**
 * @openapi
 * /inventory/products/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get product detail including FIFO-ordered inventory lots
 *     responses: { 200: { description: Product detail with lots } }
 *   patch:
 *     tags: [Inventory]
 *     summary: Update a product
 *     responses: { 200: { description: Product updated } }
 *   delete:
 *     tags: [Inventory]
 *     summary: Deactivate a product (soft delete)
 *     responses: { 204: { description: Product deactivated } }
 */
inventoryRoutes
  .route('/products/:id')
  .get(requirePermission('inventory:view'), productsController.getDetail)
  .patch(requirePermission('inventory:edit'), productsController.update)
  .delete(requirePermission('inventory:delete'), productsController.deactivate);

/**
 * @openapi
 * /inventory/goods-receipts:
 *   post:
 *     tags: [Inventory]
 *     summary: Record a goods receipt (creates inventory lots, optionally against a PO)
 *     responses: { 201: { description: Lots created } }
 */
inventoryRoutes.post(
  '/goods-receipts',
  requirePermission('inventory:create'),
  stockController.goodsReceipt,
);

/**
 * @openapi
 * /inventory/adjustments:
 *   post:
 *     tags: [Inventory]
 *     summary: Manually adjust stock (increase creates/tops-up a lot; decrease consumes FIFO)
 *     responses: { 201: { description: Adjustment recorded } }
 */
inventoryRoutes.post(
  '/adjustments',
  requirePermission('inventory:edit'),
  stockController.adjust,
);

/**
 * @openapi
 * /inventory/alerts/low-stock:
 *   get:
 *     tags: [Inventory]
 *     summary: Products at or below their reorder level
 *     responses: { 200: { description: Low stock alert list } }
 */
inventoryRoutes.get(
  '/alerts/low-stock',
  requirePermission('inventory:view'),
  stockController.lowStockAlerts,
);

/**
 * @openapi
 * /inventory/alerts/expiring:
 *   get:
 *     tags: [Inventory]
 *     summary: Inventory lots expiring within N days (default 30), including already-expired
 *     responses: { 200: { description: Expiry alert list } }
 */
inventoryRoutes.get(
  '/alerts/expiring',
  requirePermission('inventory:view'),
  stockController.expiryAlerts,
);

/**
 * @openapi
 * /inventory/valuation:
 *   get:
 *     tags: [Inventory]
 *     summary: Inventory valuation (quantity × cost price, by product, with grand total)
 *     responses: { 200: { description: Valuation summary } }
 */
inventoryRoutes.get(
  '/valuation',
  requirePermission('inventory:view'),
  stockController.valuation,
);
