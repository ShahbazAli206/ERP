import { ApiError } from '../../shared/ApiError';
import { exchangeRatesRepository } from './exchangeRates.repository';
import type { ExchangeRateDto } from './exchangeRates.dto';
import type { CreateExchangeRateInput, UpdateExchangeRateInput } from './exchangeRates.validation';

export const exchangeRatesService = {
  list(): Promise<ExchangeRateDto[]> {
    return exchangeRatesRepository.list();
  },

  async create(input: CreateExchangeRateInput): Promise<ExchangeRateDto> {
    const existing = await exchangeRatesRepository.findByCurrencyCode(input.currencyCode);
    if (existing) {
      throw ApiError.conflict(`Exchange rate for ${input.currencyCode} already exists`);
    }
    return exchangeRatesRepository.create(input.currencyCode, input.rateToBase);
  },

  async update(currencyCode: string, input: UpdateExchangeRateInput): Promise<ExchangeRateDto> {
    return exchangeRatesRepository.upsert(currencyCode, input.rateToBase);
  },

  async remove(currencyCode: string): Promise<void> {
    const existing = await exchangeRatesRepository.findByCurrencyCode(currencyCode);
    if (!existing) {
      throw ApiError.notFound(`Exchange rate for ${currencyCode} not found`);
    }
    await exchangeRatesRepository.delete(currencyCode);
  },
};
