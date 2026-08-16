import {
  expandCoverageMonthKeys,
  financeCalendarMonthKey,
  isValidCoverageMonthKey,
} from './subscription-coverage-month';

const FALLBACK_COVERAGE_MONTH_COUNT = 1;
const SUBSCRIPTION_INVOICE_TYPE = 'SUBSCRIPTION';

/** Plain invoice row used for coverage-window billing dedup (no Prisma types). */
export interface SubscriptionCoverageInvoiceRow {
  coverageStartMonth: string | null;
  coverageMonthCount: number | null;
  createdAt: Date;
  /** When present, term helpers count only `SUBSCRIPTION` rows. */
  type?: string;
}

/**
 * True when `billingMonthKey` (`YYYY-MM`) falls inside any invoice coverage window.
 * Considers all invoices regardless of payment status. Null/invalid coverage fields
 * fall back to the calendar month of `createdAt` with a 1-month window.
 */
export function isBillingMonthCoveredByInvoices(
  billingMonthKey: string,
  invoices: readonly SubscriptionCoverageInvoiceRow[],
): boolean {
  if (!isValidCoverageMonthKey(billingMonthKey)) {
    return false;
  }
  for (const invoice of invoices) {
    if (coveredMonthKeysForInvoice(invoice).includes(billingMonthKey)) {
      return true;
    }
  }
  return false;
}

/**
 * Distinct calendar months covered by SUBSCRIPTION invoices (union of coverage windows).
 * Overlapping invoices do not double-count. Null/invalid coverage fields fall back to the
 * invoice `createdAt` month with a 1-month window (same convention as billing dedup).
 */
export function countDistinctCoveredMonths(
  invoices: readonly SubscriptionCoverageInvoiceRow[],
): number {
  return collectDistinctCoveredMonthKeys(invoices).size;
}

/**
 * Lexicographically latest `YYYY-MM` covered by SUBSCRIPTION invoices, or null when none.
 */
export function latestCoveredMonthKey(
  invoices: readonly SubscriptionCoverageInvoiceRow[],
): string | null {
  const keys = collectDistinctCoveredMonthKeys(invoices);
  if (keys.size === 0) {
    return null;
  }
  return [...keys].sort().at(-1) ?? null;
}

function collectDistinctCoveredMonthKeys(
  invoices: readonly SubscriptionCoverageInvoiceRow[],
): Set<string> {
  const keys = new Set<string>();
  for (const invoice of invoices) {
    if (invoice.type !== SUBSCRIPTION_INVOICE_TYPE) {
      continue;
    }
    for (const key of coveredMonthKeysForInvoice(invoice)) {
      keys.add(key);
    }
  }
  return keys;
}

function coveredMonthKeysForInvoice(invoice: SubscriptionCoverageInvoiceRow): string[] {
  const start =
    invoice.coverageStartMonth && isValidCoverageMonthKey(invoice.coverageStartMonth)
      ? invoice.coverageStartMonth
      : financeCalendarMonthKey(invoice.createdAt);
  const count =
    invoice.coverageMonthCount != null && invoice.coverageMonthCount >= 1
      ? invoice.coverageMonthCount
      : FALLBACK_COVERAGE_MONTH_COUNT;
  return expandCoverageMonthKeys(start, count);
}
