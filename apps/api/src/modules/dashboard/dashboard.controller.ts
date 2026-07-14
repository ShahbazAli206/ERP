import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { dashboardService } from './dashboard.service';
import { dashboardRangeQuerySchema } from './dashboard.validation';

export const dashboardController = {
  async kpis(req: Request, res: Response) {
    const range = dashboardRangeQuerySchema.parse(req.query);
    ok(res, await dashboardService.kpis(range));
  },

  async revenueTrend(_req: Request, res: Response) {
    ok(res, await dashboardService.revenueTrend());
  },

  async profitTrend(_req: Request, res: Response) {
    ok(res, await dashboardService.profitTrend());
  },

  async inventoryValueByCategory(_req: Request, res: Response) {
    ok(res, await dashboardService.inventoryValueByCategory());
  },

  async salesByCategory(req: Request, res: Response) {
    const range = dashboardRangeQuerySchema.parse(req.query);
    ok(res, await dashboardService.salesByCategory(range));
  },

  async topProducts(_req: Request, res: Response) {
    ok(res, await dashboardService.topProducts());
  },

  async topSuppliers(_req: Request, res: Response) {
    ok(res, await dashboardService.topSuppliers());
  },

  async distributorPerformance(_req: Request, res: Response) {
    ok(res, await dashboardService.distributorPerformance());
  },

  async recentActivities(_req: Request, res: Response) {
    ok(res, await dashboardService.recentActivities());
  },
};
