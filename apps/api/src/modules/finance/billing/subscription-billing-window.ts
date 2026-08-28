import { clampBillingDayInMonth, daysInCalendarMonth } from './subscription-billing-days';
import {
  parseYerevanDateKey,
  yerevanCalendarDateKey,
  yerevanCalendarDayEnd,
  yerevanCalendarDayStart,
} from '../invoices/yerevan-calendar-date';

/** Only this pay day is invoiced before month start (penultimate weekday). */
export const SUBSCRIPTION_EARLY_BILLING_DAY = 1;

const SATURDAY = 6;
const SUNDAY = 0;

export interface SubscriptionBillingTarget {
  coverageMonthKey: string;
  expectedPayDate: Date;
  expectedPayKey: string;
}

export interface YerevanYearMonth {
  year: number;
  month: number;
}

/** Penultimate Mon–Fri of the calendar month as YYYY-MM-DD. */
export function penultimateWeekdayKey(year: number, month: number): string {
  const weekdays = weekdayKeysInMonth(year, month);
  return weekdays[weekdays.length - 2] ?? weekdays[0];
}

export function yerevanYearMonth(asOf: Date): YerevanYearMonth {
  const { year, month } = parseYerevanDateKey(yerevanCalendarDateKey(asOf));
  return { year, month };
}

export function shiftYearMonth(year: number, month: number, delta: number): YerevanYearMonth {
  const absolute = year * 12 + (month - 1) + delta;
  return { year: Math.floor(absolute / 12), month: (absolute % 12) + 1 };
}

export function coverageMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function buildSubscriptionBillingTarget(
  year: number,
  month: number,
  billingDay: number,
): SubscriptionBillingTarget {
  const day = clampBillingDayInMonth(year, month, billingDay);
  const expectedPayKey = `${coverageMonthKey(year, month)}-${String(day).padStart(2, '0')}`;
  return {
    coverageMonthKey: coverageMonthKey(year, month),
    expectedPayKey,
    expectedPayDate: yerevanCalendarDayStart(expectedPayKey),
  };
}

/**
 * Target coverage month for a daily billing run (Yerevan).
 * Day 1: next month from the penultimate weekday; otherwise current-month catch-up.
 * Days 2–31: current month from the 1st (catch-up for the rest of the month).
 */
export function resolveSubscriptionBillingTarget(
  asOf: Date,
  billingDay: number,
): SubscriptionBillingTarget | null {
  const { year, month } = yerevanYearMonth(asOf);
  if (billingDay !== SUBSCRIPTION_EARLY_BILLING_DAY) {
    return buildSubscriptionBillingTarget(year, month, billingDay);
  }
  return resolveDayOneBillingTarget(asOf, year, month);
}

export function isSubscriptionOpenForTarget(args: {
  billingStartDate: Date;
  endDate: Date | null;
  expectedPayKey: string;
}): boolean {
  if (yerevanCalendarDateKey(args.billingStartDate) > args.expectedPayKey) {
    return false;
  }
  if (args.endDate != null && yerevanCalendarDateKey(args.endDate) < args.expectedPayKey) {
    return false;
  }
  return true;
}

/** Loose Prisma window: current month through end of next month (Yerevan). */
export function yerevanBillingQueryBounds(asOf: Date): { gte: Date; lte: Date } {
  const { year, month } = yerevanYearMonth(asOf);
  const currentStart = `${coverageMonthKey(year, month)}-01`;
  const next = shiftYearMonth(year, month, 1);
  const nextLast = daysInCalendarMonth(next.year, next.month);
  const nextEnd = `${coverageMonthKey(next.year, next.month)}-${String(nextLast).padStart(2, '0')}`;
  return {
    gte: yerevanCalendarDayStart(currentStart),
    lte: yerevanCalendarDayEnd(nextEnd),
  };
}

function resolveDayOneBillingTarget(
  asOf: Date,
  year: number,
  month: number,
): SubscriptionBillingTarget | null {
  const asOfKey = yerevanCalendarDateKey(asOf);
  const penultimateThis = penultimateWeekdayKey(year, month);
  if (asOfKey >= penultimateThis) {
    const next = shiftYearMonth(year, month, 1);
    return buildSubscriptionBillingTarget(next.year, next.month, SUBSCRIPTION_EARLY_BILLING_DAY);
  }
  const prev = shiftYearMonth(year, month, -1);
  const penultimatePrev = penultimateWeekdayKey(prev.year, prev.month);
  if (asOfKey >= penultimatePrev) {
    return buildSubscriptionBillingTarget(year, month, SUBSCRIPTION_EARLY_BILLING_DAY);
  }
  return null;
}

function weekdayKeysInMonth(year: number, month: number): string[] {
  const keys: string[] = [];
  const last = daysInCalendarMonth(year, month);
  const ym = coverageMonthKey(year, month);
  for (let day = 1; day <= last; day += 1) {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (dow === SATURDAY || dow === SUNDAY) continue;
    keys.push(`${ym}-${String(day).padStart(2, '0')}`);
  }
  return keys;
}
