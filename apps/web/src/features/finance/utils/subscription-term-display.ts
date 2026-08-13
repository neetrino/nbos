import type { Subscription } from '@/lib/api/subscriptions';

const COVERAGE_MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const SUBSCRIPTION_INVOICE_TYPE = 'SUBSCRIPTION';

function isValidCoverageMonthKey(value: string): boolean {
  return COVERAGE_MONTH_KEY_RE.test(value);
}

function shiftCoverageMonthKey(ym: string, deltaMonths: number): string | null {
  if (!isValidCoverageMonthKey(ym) || !Number.isInteger(deltaMonths)) {
    return null;
  }
  const absolute = Number(ym.slice(0, 4)) * 12 + (Number(ym.slice(5, 7)) - 1) + deltaMonths;
  if (absolute < 0) {
    return null;
  }
  const year = Math.floor(absolute / 12);
  const month = (absolute % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function expandCoverageMonthKeys(startYm: string, monthCount: number): string[] {
  if (!isValidCoverageMonthKey(startYm) || monthCount < 1) {
    return [];
  }
  const keys: string[] = [];
  let cursor: string | null = startYm;
  for (let i = 0; i < monthCount; i += 1) {
    if (!cursor) return keys;
    keys.push(cursor);
    cursor = shiftCoverageMonthKey(cursor, 1);
  }
  return keys;
}

function financeCalendarMonthKey(isoDate: string): string | null {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function coveredMonthKeysForInvoice(invoice: Subscription['invoices'][number]): string[] {
  if (invoice.type != null && invoice.type !== SUBSCRIPTION_INVOICE_TYPE) {
    return [];
  }
  const start =
    invoice.coverageStartMonth && isValidCoverageMonthKey(invoice.coverageStartMonth)
      ? invoice.coverageStartMonth
      : invoice.createdAt
        ? financeCalendarMonthKey(invoice.createdAt)
        : null;
  if (!start) return [];
  const count =
    invoice.coverageMonthCount != null && invoice.coverageMonthCount >= 1
      ? invoice.coverageMonthCount
      : 1;
  return expandCoverageMonthKeys(start, count);
}

/** Distinct calendar months covered by subscription invoices (union of coverage windows). */
export function countSubscriptionDistinctCoveredMonths(invoices: Subscription['invoices']): number {
  const keys = new Set<string>();
  for (const invoice of invoices) {
    for (const key of coveredMonthKeysForInvoice(invoice)) {
      keys.add(key);
    }
  }
  return keys.size;
}

export function deriveSubscriptionRemainingMonths(subscription: Subscription): number | null {
  if (subscription.termMonths == null) {
    return null;
  }
  const covered = countSubscriptionDistinctCoveredMonths(subscription.invoices);
  return Math.max(0, subscription.termMonths - covered);
}

/** Fixed-term summary for detail headers and billing panels; null for open-ended. */
export function formatSubscriptionTermSummary(subscription: Subscription): string | null {
  if (subscription.termMonths == null) {
    return null;
  }
  const remaining = deriveSubscriptionRemainingMonths(subscription);
  if (remaining == null) {
    return `${subscription.termMonths}-month term`;
  }
  if (remaining === 0) {
    return `${subscription.termMonths}-month term · completed`;
  }
  return `${subscription.termMonths}-month term · ${remaining} months remaining`;
}

/** Compact grid badge label, e.g. "6 mo". */
export function formatSubscriptionTermGridBadge(termMonths: number): string {
  return `${termMonths} mo`;
}
