/**
 * Currency Exchange API — Integration Abstraction (Phase 4).
 *
 * Real implementation would call a live FX rates API (CURRENCY_EXCHANGE_API_KEY, see
 * .env.example). Not integrated in this demo — Settings' `ExchangeRate` CRUD stays
 * manual-entry on purpose (see exchangeRates.service.ts), this interface only exists so a
 * future "auto-refresh rates" feature has a real abstraction to call. The fake below
 * returns deterministic-but-varied rates derived from a small canned rate table plus a
 * currency-pair/hour seeded jitter — never random noise, never a real network call.
 */

export interface CurrencyExchangeService {
  /** Returns how many units of `to` one unit of `from` is worth. */
  getRate(from: string, to: string): Promise<number>;
}

// Canned base rates against USD, purely for plausible fake output.
const USD_BASE_RATES: Record<string, number> = {
  USD: 1,
  PKR: 278.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  CNY: 7.24,
  SAR: 3.75,
};

function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function rateAgainstUsd(code: string): number {
  const known = USD_BASE_RATES[code];
  if (known !== undefined) return known;
  // Deterministic pseudo-rate for currency codes not in the canned table.
  return 1 + (seedFromString(code) % 500) / 10;
}

class FakeCurrencyExchangeService implements CurrencyExchangeService {
  async getRate(from: string, to: string): Promise<number> {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();
    if (fromCode === toCode) return 1;

    const fromRate = rateAgainstUsd(fromCode);
    const toRate = rateAgainstUsd(toCode);

    // Small deterministic jitter (seeded by pair + current hour) so repeated calls look
    // like a live feed drifting slightly, without being random noise.
    const seed = seedFromString(`${fromCode}${toCode}${new Date().getHours()}`);
    const jitter = 1 + ((seed % 200) - 100) / 10000; // +/- 1%

    console.log(`[FAKE CURRENCY EXCHANGE] getRate(${fromCode} -> ${toCode})`);
    return Number(((toRate / fromRate) * jitter).toFixed(6));
  }
}

export const currencyExchangeService: CurrencyExchangeService = new FakeCurrencyExchangeService();
