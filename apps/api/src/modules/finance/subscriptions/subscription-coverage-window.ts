import {
  expandCoverageMonthKeys,
  financeCalendarMonthKey,
  isValidCoverageMonthKey,
} from './subscription-coverage-month';

const FALLBACK_COVERAGE_MONTH_COUNT = 1;

/** Plain invoice row used for coverage-window billing dedup (no Prisma types). */
export interface SubscriptionCoverageInvoiceRow {
  coverageStartMonth: string | null;
  coverageMonthCount: number | null;
  createdAt: Date;
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
