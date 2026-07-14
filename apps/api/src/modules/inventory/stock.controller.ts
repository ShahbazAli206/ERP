import type { Request, Response } from 'express';
import { created, ok } from '../../shared/response';
import { stockService } from './stock.service';
import {
  createGoodsReceiptSchema,
  expiryAlertQuerySchema,
  stockAdjustmentSchema,
} from './stock.validation';

export const stockController = {
  async goodsReceipt(req: Request, res: Response) {
    const input = createGoodsReceiptSchema.parse(req.body);
    created(res, await stockService.goodsReceipt(input));
  },

  async adjust(req: Request, res: Response) {
    const input = stockAdjustmentSchema.parse(req.body);
    created(res, await stockService.adjust(input));
  },

  async lowStockAlerts(_req: Request, res: Response) {
    ok(res, await stockService.lowStockAlerts());
  },

  async expiryAlerts(req: Request, res: Response) {
    const { withinDays } = expiryAlertQuerySchema.parse(req.query);
    ok(res, await stockService.expiryAlerts(withinDays));
  },

  async valuation(req: Request, res: Response) {
    const warehouseId = typeof req.query.warehouseId === 'string' ? req.query.warehouseId : undefined;
    ok(res, await stockService.valuation(warehouseId));
  },
};
