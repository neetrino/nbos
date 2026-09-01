import type { Subscription } from '@/lib/api/subscriptions';
import {
  collectCoveredSubscriptionMonthKeys,
  deriveSubscriptionRemainingMonths,
  shiftCoverageMonthKey,
} from './subscription-term-display';

const YEREVAN_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Yerevan',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const MANUAL_SUBSCRIPTION_INVOICE_MAX_MONTHS_AHEAD = 12;
export const MANUAL_SUBSCRIPTION_INVOICE_MAX_CARDS = 12;

export function yerevanMonthKey(date: Date): string {
  return YEREVAN_DATE.format(date).slice(0, 7);
}

export function shiftSubscriptionMonthKey(ym: string, deltaMonths: number): string | null {
  return shiftCoverageMonthKey(ym, deltaMonths);
}

export function formatSubscriptionInvoiceMonthLabel(monthKey: string, locale = 'en'): string {
  if (!MONTH_KEY_RE.test(monthKey)) {
    return monthKey;
  }
  const year = Number(monthKey.slice(0, 4));
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(year, monthIndex, 1),
  );
}

export function defaultSubscriptionInvoiceMonth(eligible: readonly string[], now: Date): string {
  const current = yerevanMonthKey(now);
  const next = shiftSubscriptionMonthKey(current, 1);
  if (eligible.includes(current)) return current;
  if (next && eligible.includes(next)) return next;
  return eligible.at(-1) ?? '';
}

/**
 * Uncovered coverage-start months from billing start through the next 12 Yerevan months.
 * Only ACTIVE subscriptions with enough remaining term are listed.
 */
export function listEligibleSubscriptionInvoiceMonths(
  subscription: Subscription,
  now: Date = new Date(),
): string[] {
  if (subscription.status !== 'ACTIVE') {
    return [];
  }
  const remaining = deriveSubscriptionRemainingMonths(subscription);
  if (remaining !== null && remaining < subscription.coverageMonthCount) {
    return [];
  }
  const startKey = yerevanMonthKey(new Date(subscription.billingStartDate));
  const currentKey = yerevanMonthKey(now);
  const maxKey = shiftSubscriptionMonthKey(
    currentKey,
    MANUAL_SUBSCRIPTION_INVOICE_MAX_MONTHS_AHEAD,
  );
  const endKey = subscription.endDate ? yerevanMonthKey(new Date(subscription.endDate)) : null;
  const lastKey = pickLastEligibleMonth(maxKey, endKey);
  if (!lastKey || startKey > lastKey) {
    return [];
  }
  const covered = collectCoveredSubscriptionMonthKeys(subscription.invoices ?? []);
  return collectMonthKeys(startKey, lastKey).filter(
    (key) => !monthWindowCovered(key, subscription, covered),
  );
}

function pickLastEligibleMonth(maxKey: string | null, endKey: string | null): string | null {
  if (!maxKey) return endKey;
  if (!endKey) return maxKey;
  return endKey < maxKey ? endKey : maxKey;
}

function collectMonthKeys(startKey: string, lastKey: string): string[] {
  const keys: string[] = [];
  let cursor: string | null = startKey;
  while (cursor && cursor <= lastKey) {
    keys.push(cursor);
    cursor = shiftSubscriptionMonthKey(cursor, 1);
  }
  return keys;
}

export function isCoverageMonthBlockedBySelection(
  monthKey: string,
  selected: readonly string[],
  coverageMonthCount: number,
): boolean {
  if (selected.includes(monthKey)) return false;
  return selected.some((start) => coverageWindowsOverlap(start, monthKey, coverageMonthCount));
}

export function canSelectAnotherCoverageMonth(args: {
  selectedCount: number;
  coverageMonthCount: number;
  remainingMonths: number | null;
  maxCards?: number;
}): boolean {
  const maxCards = args.maxCards ?? MANUAL_SUBSCRIPTION_INVOICE_MAX_CARDS;
  if (args.selectedCount >= maxCards) return false;
  if (args.remainingMonths == null) return true;
  return (args.selectedCount + 1) * args.coverageMonthCount <= args.remainingMonths;
}

export function toggleCoverageMonthSelection(
  selected: readonly string[],
  monthKey: string,
  coverageMonthCount: number,
  maxSelected = MANUAL_SUBSCRIPTION_INVOICE_MAX_CARDS,
): string[] {
  if (selected.includes(monthKey)) {
    return selected.filter((key) => key !== monthKey);
  }
  if (selected.length >= maxSelected) return [...selected];
  if (isCoverageMonthBlockedBySelection(monthKey, selected, coverageMonthCount)) {
    return [...selected];
  }
  return [...selected, monthKey].sort();
}

function coverageWindowsOverlap(left: string, right: string, monthCount: number): boolean {
  const leftKeys = new Set(expandMonthWindow(left, monthCount));
  return expandMonthWindow(right, monthCount).some((key) => leftKeys.has(key));
}

function expandMonthWindow(startKey: string, monthCount: number): string[] {
  const keys: string[] = [];
  let cursor: string | null = startKey;
  for (let i = 0; i < monthCount; i += 1) {
    if (!cursor) return keys;
    keys.push(cursor);
    cursor = shiftSubscriptionMonthKey(cursor, 1);
  }
  return keys;
}

function monthWindowCovered(
  startKey: string,
  subscription: Subscription,
  covered: Set<string>,
): boolean {
  let cursor: string | null = startKey;
  for (let i = 0; i < subscription.coverageMonthCount; i += 1) {
    if (!cursor || covered.has(cursor)) {
      return true;
    }
    cursor = shiftSubscriptionMonthKey(cursor, 1);
  }
  return false;
}
