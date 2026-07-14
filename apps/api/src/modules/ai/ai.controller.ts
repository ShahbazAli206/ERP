import type { Request, Response } from 'express';
import { ok } from '../../shared/response';
import { aiService } from './ai.service';

export const aiController = {
  async bestSellingProducts(_req: Request, res: Response) {
    const data = await aiService.bestSellingProducts();
    ok(res, data);
  },

  async slowMovingInventory(_req: Request, res: Response) {
    const data = await aiService.slowMovingInventory();
    ok(res, data);
  },

  async demandForecast(_req: Request, res: Response) {
    const data = await aiService.demandForecast();
    ok(res, data);
  },

  async seasonalAnalysis(_req: Request, res: Response) {
    const data = aiService.seasonalAnalysis();
    ok(res, data);
  },

  async importRecommendation(_req: Request, res: Response) {
    const data = await aiService.importRecommendation();
    ok(res, data);
  },

  async predictiveCharts(_req: Request, res: Response) {
    const data = aiService.predictiveCharts();
    ok(res, data);
  },
};
