import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { exchangeRatesService } from './exchangeRates.service';
import {
  createExchangeRateSchema,
  currencyCodeParamSchema,
  updateExchangeRateSchema,
} from './exchangeRates.validation';

export const exchangeRatesController = {
  async list(_req: Request, res: Response) {
    const rates = await exchangeRatesService.list();
    ok(res, rates);
  },

  async create(req: Request, res: Response) {
    const input = createExchangeRateSchema.parse(req.body);
    const rate = await exchangeRatesService.create(input);
    created(res, rate);
  },

  async update(req: Request<{ currencyCode: string }>, res: Response) {
    const { currencyCode } = currencyCodeParamSchema.parse(req.params);
    const input = updateExchangeRateSchema.parse(req.body);
    const rate = await exchangeRatesService.update(currencyCode, input);
    ok(res, rate);
  },

  async remove(req: Request<{ currencyCode: string }>, res: Response) {
    const { currencyCode } = currencyCodeParamSchema.parse(req.params);
    await exchangeRatesService.remove(currencyCode);
    noContent(res);
  },
};
