import { BadRequestException } from '@nestjs/common';
import {
  expandCoverageMonthKeys,
  isValidCoverageMonthKey,
  shiftCoverageMonthKey,
} from './subscription-coverage-month';
import {
  coverageWindowOverlapsInvoices,
  countDistinctCoveredMonths,
  type SubscriptionCoverageInvoiceRow,
} from './subscription-coverage-window';
import { yerevanCalendarDateKey } from '../invoices/yerevan-calendar-date';
import {
  coverageMonthKey,
  shiftYearMonth,
  yerevanYearMonth,
} from '../billing/subscription-billing-window';

/** Manual issue may target uncovered months through the next 12 Yerevan months. */
export const MANUAL_SUBSCRIPTION_INVOICE_MAX_MONTHS_AHEAD = 12;

/** One request creates at most this many separate period cards. */
export const MANUAL_SUBSCRIPTION_INVOICE_MAX_CARDS = 12;

export const SUBSCRIPTION_PERIOD_INVOICE_ERROR = {
  NOT_ACTIVE: 'Only active subscriptions can create a billing invoice.',
  INVALID_MONTH: 'coverageMonth must be YYYY-MM.',
  EMPTY_MONTHS: 'Select at least one coverage month.',
  BATCH_SIZE: `Create at most ${MANUAL_SUBSCRIPTION_INVOICE_MAX_CARDS} invoices at once.`,
  SELECTED_OVERLAP: 'Selected months overlap each other.',
  BEFORE_START: 'Coverage month is before the subscription billing start.',
  AFTER_END: 'Coverage month is after the subscription end date.',
  TOO_FAR: 'Choose an uncovered month from the billing start through the next 12 months.',
  ALREADY_COVERED: 'An invoice already covers that month.',
  TERM_COMPLETE: 'The subscription term is already fully covered.',
  TERM_REMAINING: 'Not enough remaining term months for this billing period.',
  DELIVERY_PAUSE: 'Billing is paused until delivery is completed.',
} as const;

export function parseCoverageMonthKey(raw: string | undefined): string {
  const key = raw?.trim() ?? '';
  if (!isValidCoverageMonthKey(key)) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.INVALID_MONTH);
  }
  return key;
}

export type CreatePeriodInvoiceBody = {
  coverageMonth?: string;
  coverageMonths?: string[];
};

/** Unique sorted YYYY-MM keys. Accepts `coverageMonths` or a single `coverageMonth`. */
export function parseCoverageMonthKeys(body: CreatePeriodInvoiceBody): string[] {
  const raw = resolveRawMonthList(body);
  if (raw.length === 0) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.EMPTY_MONTHS);
  }
  if (raw.length > MANUAL_SUBSCRIPTION_INVOICE_MAX_CARDS) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.BATCH_SIZE);
  }
  const unique = [...new Set(raw.map((value) => parseCoverageMonthKey(value)))];
  unique.sort();
  return unique;
}

export function assertSelectedCoverageWindowsCompatible(
  coverageMonthKeys: readonly string[],
  coverageMonthCount: number,
): void {
  const covered = new Set<string>();
  for (const start of coverageMonthKeys) {
    const keys = expandCoverageMonthKeys(start, coverageMonthCount);
    if (keys.some((key) => covered.has(key))) {
      throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.SELECTED_OVERLAP);
    }
    for (const key of keys) {
      covered.add(key);
    }
  }
}

function resolveRawMonthList(body: CreatePeriodInvoiceBody): string[] {
  if (Array.isArray(body.coverageMonths) && body.coverageMonths.length > 0) {
    return body.coverageMonths;
  }
  if (body.coverageMonth != null && body.coverageMonth.trim() !== '') {
    return [body.coverageMonth];
  }
  return [];
}

export function yerevanMonthKeyFromDate(date: Date): string {
  return yerevanCalendarDateKey(date).slice(0, 7);
}

export function maxManualInvoiceMonthKey(now: Date): string {
  const { year, month } = yerevanYearMonth(now);
  const next = shiftYearMonth(year, month, MANUAL_SUBSCRIPTION_INVOICE_MAX_MONTHS_AHEAD);
  return coverageMonthKey(next.year, next.month);
}

export function assertCoverageMonthInManualWindow(args: {
  coverageMonthKey: string;
  now: Date;
  billingStartDate: Date;
  endDate: Date | null;
}): void {
  const startKey = yerevanMonthKeyFromDate(args.billingStartDate);
  if (args.coverageMonthKey < startKey) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.BEFORE_START);
  }
  if (args.endDate != null && args.coverageMonthKey > yerevanMonthKeyFromDate(args.endDate)) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.AFTER_END);
  }
  if (args.coverageMonthKey > maxManualInvoiceMonthKey(args.now)) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.TOO_FAR);
  }
}

export function assertCoverageMonthFreeForCharge(args: {
  coverageMonthKey: string;
  coverageMonthCount: number;
  invoices: readonly SubscriptionCoverageInvoiceRow[];
  termMonths: number | null;
}): void {
  if (
    coverageWindowOverlapsInvoices(args.coverageMonthKey, args.coverageMonthCount, args.invoices)
  ) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.ALREADY_COVERED);
  }
  if (args.termMonths == null) {
    return;
  }
  const remaining = args.termMonths - countDistinctCoveredMonths(args.invoices);
  if (remaining <= 0) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.TERM_COMPLETE);
  }
  if (remaining < args.coverageMonthCount) {
    throw new BadRequestException(SUBSCRIPTION_PERIOD_INVOICE_ERROR.TERM_REMAINING);
  }
}

/** Inclusive YYYY-MM keys from billing start through the manual cap (or end date). */
export function listManualInvoiceMonthKeys(args: {
  now: Date;
  billingStartDate: Date;
  endDate: Date | null;
}): string[] {
  const startKey = yerevanMonthKeyFromDate(args.billingStartDate);
  const lastKey =
    args.endDate != null
      ? minMonthKey(yerevanMonthKeyFromDate(args.endDate), maxManualInvoiceMonthKey(args.now))
      : maxManualInvoiceMonthKey(args.now);
  if (startKey > lastKey) {
    return [];
  }
  const keys: string[] = [];
  let cursor: string | null = startKey;
  while (cursor && cursor <= lastKey) {
    keys.push(cursor);
    cursor = shiftCoverageMonthKey(cursor, 1);
  }
  return keys;
}

function minMonthKey(a: string, b: string): string {
  return a < b ? a : b;
}
