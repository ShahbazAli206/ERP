import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { aiRoutes } from './modules/ai/ai.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { distributorsRoutes } from './modules/distributors/distributors.routes';
import { expensesRoutes } from './modules/expenses/expenses.routes';
import { financeRoutes } from './modules/finance/finance.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { procurementRoutes } from './modules/procurement/procurement.routes';
import { salesRoutes } from './modules/sales/sales.routes';
import { settingsRoutes } from './modules/settings/settings.routes';
import { shipmentsRoutes } from './modules/shipments/shipments.routes';
import { suppliersRoutes } from './modules/suppliers/suppliers.routes';
import { taxRoutes } from './modules/tax/tax.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api/auth', authRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/procurement', procurementRoutes);
  app.use('/api/shipments', shipmentsRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/distributors', distributorsRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/expenses', expensesRoutes);
  app.use('/api/tax', taxRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
