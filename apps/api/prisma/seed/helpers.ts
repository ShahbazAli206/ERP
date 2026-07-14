import { prisma } from '../../src/database/prisma';

/** Inclusive random integer in [min, max]. */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float in [min, max). */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomChoice<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/** `count` distinct random elements from `arr` (no repeats), order not significant. */
export function randomChoices<T>(arr: readonly T[], count: number): T[] {
  const pool = [...arr];
  const n = Math.min(count, pool.length);
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = randomInt(0, pool.length - 1);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

/** Fisher-Yates shuffle, returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Approximate FX rates: 1 unit of currency = N PKR (the app's base currency). Reused for every
 * PurchaseOrder/Shipment `exchangeRateToBase` field and for the ExchangeRate reference rows
 * seeded in seedTaxAndSettings, so every module's currency math is derived from the same
 * numbers instead of disagreeing with itself.
 *
 * Deliberately kept >= 1 for every currency (real-world VND/IDR/KRW would be well below 1).
 * suppliersRepository.outstandingBalance() and the dashboard's top-suppliers ranking sum raw
 * `quantity * unitPrice` across POs without ever multiplying by exchangeRateToBase (a
 * pre-existing app-level simplification, out of scope for this seed script to change) — since
 * `unitPrice` is stored in the PO's own currency, a rate below 1 makes that per-unit face
 * value balloon (unitPrice = costPriceInBase / rate), which blew the naive summation up into
 * the billions during testing. Keeping every rate >= 1 avoids that failure mode while still
 * giving 16 distinct currencies for realistic supplier diversity.
 */
// Approximate real-world value of 1 unit of each currency in PKR (base currency). Now that
// suppliers.repository.ts's outstandingBalance, shared/analytics.ts's supplier ranking, and
// reports.service.ts's purchase report all correctly multiply by exchangeRateToBase before
// summing across suppliers (see shared/currency.ts, IMPLEMENTATION_PLAN.md Gap #8), these must
// be genuine rates rather than clamped to >=1 — a prior version of this table inflated
// VND/KRW/IDR to >=1 to mask that bug before it was fixed at the source.
export const CURRENCY_RATES: Record<string, number> = {
  PKR: 1,
  USD: 278,
  EUR: 300,
  GBP: 350,
  CNY: 38,
  AED: 75.7,
  TRY: 8.5,
  VND: 0.011,
  KRW: 0.21,
  MYR: 59,
  THB: 7.7,
  JPY: 1.8,
  SAR: 74,
  IDR: 0.018,
  BDT: 2.5,
  SGD: 205,
  TWD: 8.6,
};

/**
 * Relative order-volume weights for the trailing 12 calendar months, oldest first. Gives a
 * mild growth trend with non-monotonic ups and downs, rather than a flat uniform rate, so
 * monthly trend charts actually show month-to-month variation.
 */
const MONTH_WEIGHTS = [5, 6, 7, 6, 8, 7, 9, 8, 10, 11, 12, 11];

/** Picks a "months ago" offset (0 = current month, 11 = eleven months ago) using MONTH_WEIGHTS. */
export function weightedMonthsAgo(): number {
  const total = MONTH_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < MONTH_WEIGHTS.length; i++) {
    r -= MONTH_WEIGHTS[i];
    if (r <= 0) {
      return MONTH_WEIGHTS.length - 1 - i;
    }
  }
  return 0;
}

/**
 * A random Date within the calendar month `monthsAgo` months before the current month
 * (clamped so the current month never produces a future date).
 */
export function randomDateInMonthsAgo(monthsAgo: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - monthsAgo;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let day = randomInt(1, daysInMonth);
  if (monthsAgo === 0) {
    day = Math.min(day, now.getDate());
  }
  const hour = randomInt(8, 18);
  const minute = randomInt(0, 59);
  return new Date(year, month, day, hour, minute);
}

/** A random historical date spread across the trailing 12 months, weighted by MONTH_WEIGHTS. */
export function randomHistoricalDate(): Date {
  return randomDateInMonthsAgo(weightedMonthsAgo());
}

/** `date + days` days, with no clamping — use for forward-looking predictions/obligations
 * (expected/estimated arrival, invoice due dates) which are legitimately allowed to fall in
 * the future relative to "now". */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** `date + days` days, clamped so the result never lands in the future relative to now. Use
 * for fields that represent something that has already happened (actual arrival, issue date,
 * payment date) — never a forward-looking prediction. */
export function addDaysClamped(date: Date, days: number): Date {
  const result = addDays(date, days);
  const now = new Date();
  return result.getTime() > now.getTime() ? now : result;
}

export interface DemoUsers {
  admin: string;
  procurement: string;
  inventory: string;
  sales: string;
  accountant: string;
  executive: string;
}

const DEMO_USER_EMAILS: Record<keyof DemoUsers, string> = {
  admin: 'admin@erp.local',
  procurement: 'procurement@erp.local',
  inventory: 'inventory@erp.local',
  sales: 'sales@erp.local',
  accountant: 'accounts@erp.local',
  executive: 'executive@erp.local',
};

/** Looks up the six demo users seeded by seedRolesAndUsers(), keyed by role. */
export async function getDemoUserIds(): Promise<DemoUsers> {
  const keys = Object.keys(DEMO_USER_EMAILS) as Array<keyof DemoUsers>;
  const ids = await Promise.all(
    keys.map((key) => prisma.user.findUniqueOrThrow({ where: { email: DEMO_USER_EMAILS[key] } })),
  );
  const result = {} as DemoUsers;
  keys.forEach((key, i) => {
    result[key] = ids[i].id;
  });
  return result;
}
