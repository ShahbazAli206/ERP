import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { accountsController } from './accounts.controller';
import { bankAccountsController } from './bankAccounts.controller';
import { journalEntriesController } from './journalEntries.controller';
import { reportsController } from './reports.controller';

export const financeRoutes = Router();

financeRoutes.use(authenticate);

/**
 * @openapi
 * /finance/bank-accounts:
 *   get:
 *     tags: [Finance]
 *     summary: List bank accounts (paginated, searchable)
 *     responses: { 200: { description: Paginated bank account list } }
 *   post:
 *     tags: [Finance]
 *     summary: Create a bank account
 *     responses: { 201: { description: Bank account created } }
 */
financeRoutes
  .route('/bank-accounts')
  .get(requirePermission('finance:view'), bankAccountsController.list)
  .post(requirePermission('finance:create'), bankAccountsController.create);

/**
 * @openapi
 * /finance/bank-accounts/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get a bank account
 *     responses: { 200: { description: Bank account } }
 *   patch:
 *     tags: [Finance]
 *     summary: Update a bank account
 *     responses: { 200: { description: Bank account updated } }
 *   delete:
 *     tags: [Finance]
 *     summary: Delete a bank account
 *     responses: { 204: { description: Bank account deleted } }
 */
financeRoutes
  .route('/bank-accounts/:id')
  .get(requirePermission('finance:view'), bankAccountsController.getById)
  .patch(requirePermission('finance:edit'), bankAccountsController.update)
  .delete(requirePermission('finance:edit'), bankAccountsController.remove);

/**
 * @openapi
 * /finance/accounts:
 *   get:
 *     tags: [Finance]
 *     summary: List chart-of-accounts entries (paginated, filterable by type)
 *     responses: { 200: { description: Paginated account list } }
 *   post:
 *     tags: [Finance]
 *     summary: Create a chart-of-accounts entry
 *     responses: { 201: { description: Account created } }
 */
financeRoutes
  .route('/accounts')
  .get(requirePermission('finance:view'), accountsController.list)
  .post(requirePermission('finance:create'), accountsController.create);

/**
 * @openapi
 * /finance/accounts/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get a chart-of-accounts entry
 *     responses: { 200: { description: Account } }
 *   patch:
 *     tags: [Finance]
 *     summary: Update a chart-of-accounts entry
 *     responses: { 200: { description: Account updated } }
 *   delete:
 *     tags: [Finance]
 *     summary: Delete a chart-of-accounts entry
 *     responses: { 204: { description: Account deleted } }
 */
financeRoutes
  .route('/accounts/:id')
  .get(requirePermission('finance:view'), accountsController.getById)
  .patch(requirePermission('finance:edit'), accountsController.update)
  .delete(requirePermission('finance:edit'), accountsController.remove);

/**
 * @openapi
 * /finance/journal-entries:
 *   get:
 *     tags: [Finance]
 *     summary: List journal entries (paginated)
 *     responses: { 200: { description: Paginated journal entry list } }
 *   post:
 *     tags: [Finance]
 *     summary: Create a journal entry (lines must balance — total debits equal total credits)
 *     responses: { 201: { description: Journal entry created } }
 */
financeRoutes
  .route('/journal-entries')
  .get(requirePermission('finance:view'), journalEntriesController.list)
  .post(requirePermission('finance:create'), journalEntriesController.create);

/**
 * @openapi
 * /finance/journal-entries/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get journal entry detail (lines with account info)
 *     responses: { 200: { description: Journal entry detail } }
 */
financeRoutes.get(
  '/journal-entries/:id',
  requirePermission('finance:view'),
  journalEntriesController.getDetail,
);

/**
 * @openapi
 * /finance/receivables:
 *   get:
 *     tags: [Finance]
 *     summary: Distributors with a positive outstanding balance
 *     responses: { 200: { description: Receivables list } }
 */
financeRoutes.get('/receivables', requirePermission('finance:view'), reportsController.receivables);

/**
 * @openapi
 * /finance/payables:
 *   get:
 *     tags: [Finance]
 *     summary: Suppliers with a positive outstanding balance
 *     responses: { 200: { description: Payables list } }
 */
financeRoutes.get('/payables', requirePermission('finance:view'), reportsController.payables);

/**
 * @openapi
 * /finance/cash-position:
 *   get:
 *     tags: [Finance]
 *     summary: Sum of all bank account balances
 *     responses: { 200: { description: Cash position } }
 */
financeRoutes.get('/cash-position', requirePermission('finance:view'), reportsController.cashPosition);

/**
 * @openapi
 * /finance/profit-loss:
 *   get:
 *     tags: [Finance]
 *     summary: Income, COGS, expenses and net profit for a date range
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses: { 200: { description: Profit & loss summary } }
 */
financeRoutes.get('/profit-loss', requirePermission('finance:view'), reportsController.profitLoss);

/**
 * @openapi
 * /finance/balance-sheet:
 *   get:
 *     tags: [Finance]
 *     summary: Assets, liabilities and equity as of now
 *     responses: { 200: { description: Balance sheet } }
 */
financeRoutes.get('/balance-sheet', requirePermission('finance:view'), reportsController.balanceSheet);

/**
 * @openapi
 * /finance/cash-flow:
 *   get:
 *     tags: [Finance]
 *     summary: Incoming/outgoing payment totals for a date range, with a day-by-day breakdown
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         required: true
 *         schema: { type: string, format: date }
 *     responses: { 200: { description: Cash flow summary } }
 */
financeRoutes.get('/cash-flow', requirePermission('finance:view'), reportsController.cashFlow);
