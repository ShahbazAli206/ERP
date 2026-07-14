import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { companySettingsController } from './companySettings.controller';
import { exchangeRatesController } from './exchangeRates.controller';
import { systemSettingsController } from './systemSettings.controller';
import { settingsUsersController } from './users.controller';
import { settingsRolesController } from './roles.controller';
import { systemLogsController } from './systemLogs.controller';

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);

/**
 * @openapi
 * /settings/company:
 *   get:
 *     tags: [Settings]
 *     summary: Get company settings (singleton, created with defaults on first access)
 *     responses:
 *       200: { description: Company settings }
 *   put:
 *     tags: [Settings]
 *     summary: Update company settings (singleton upsert)
 *     responses:
 *       200: { description: Company settings updated }
 */
settingsRoutes
  .route('/company')
  .get(requirePermission('settings:view'), companySettingsController.get)
  .put(requirePermission('settings:edit'), companySettingsController.update);

/**
 * @openapi
 * /settings/exchange-rates:
 *   get:
 *     tags: [Settings]
 *     summary: List exchange rates
 *     responses:
 *       200: { description: Exchange rate list }
 *   post:
 *     tags: [Settings]
 *     summary: Create an exchange rate
 *     responses:
 *       201: { description: Exchange rate created }
 */
settingsRoutes
  .route('/exchange-rates')
  .get(requirePermission('settings:view'), exchangeRatesController.list)
  .post(requirePermission('settings:create'), exchangeRatesController.create);

/**
 * @openapi
 * /settings/exchange-rates/{currencyCode}:
 *   put:
 *     tags: [Settings]
 *     summary: Update (or create) the rate for a currency
 *     responses:
 *       200: { description: Exchange rate updated }
 *   delete:
 *     tags: [Settings]
 *     summary: Delete an exchange rate
 *     responses:
 *       204: { description: Exchange rate deleted }
 */
settingsRoutes
  .route('/exchange-rates/:currencyCode')
  .put(requirePermission('settings:edit'), exchangeRatesController.update)
  .delete(requirePermission('settings:delete'), exchangeRatesController.remove);

/**
 * @openapi
 * /settings/system/{key}:
 *   get:
 *     tags: [Settings]
 *     summary: Get a system setting value by key
 *     responses:
 *       200: { description: System setting }
 *       404: { description: Not found }
 *   put:
 *     tags: [Settings]
 *     summary: Upsert a system setting value by key
 *     responses:
 *       200: { description: System setting updated }
 */
settingsRoutes
  .route('/system/:key')
  .get(requirePermission('settings:view'), systemSettingsController.get)
  .put(requirePermission('settings:edit'), systemSettingsController.update);

/**
 * @openapi
 * /settings/users:
 *   get:
 *     tags: [Settings]
 *     summary: List users (read-only, paginated)
 *     responses:
 *       200: { description: Paginated user list }
 */
settingsRoutes.get('/users', requirePermission('settings:view'), settingsUsersController.list);

/**
 * @openapi
 * /settings/roles:
 *   get:
 *     tags: [Settings]
 *     summary: List roles with their permission keys (read-only)
 *     responses:
 *       200: { description: Role list }
 */
settingsRoutes.get('/roles', requirePermission('settings:view'), settingsRolesController.list);

/**
 * @openapi
 * /settings/system-logs:
 *   get:
 *     tags: [Settings]
 *     summary: List audit log entries (paginated, most recent first)
 *     responses:
 *       200: { description: Paginated audit log list }
 */
settingsRoutes.get(
  '/system-logs',
  requirePermission('settings:view'),
  systemLogsController.list,
);
