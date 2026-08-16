import { lastDateOfCoverageMonth } from '../subscriptions/subscription-coverage-month';
import {
  countDistinctCoveredMonths,
  latestCoveredMonthKey,
  type SubscriptionCoverageInvoiceRow,
} from '../subscriptions/subscription-coverage-window';

export interface TermCompletionDecision {
  shouldComplete: boolean;
  /** Set when completing and `endDate` was null. */
  endDate: Date | null;
  coveredMonths: number;
}

/**
 * Decide whether a fixed-term subscription has already consumed its agreed covered months.
 * Open-ended (`termMonths` null) never completes via this path.
 */
export function resolveTermCompletion(input: {
  termMonths: number | null;
  endDate: Date | null;
  invoices: readonly SubscriptionCoverageInvoiceRow[];
}): TermCompletionDecision {
  if (input.termMonths == null) {
    return { shouldComplete: false, endDate: null, coveredMonths: 0 };
  }
  const coveredMonths = countDistinctCoveredMonths(input.invoices);
  if (coveredMonths < input.termMonths) {
    return { shouldComplete: false, endDate: null, coveredMonths };
  }
  if (input.endDate != null) {
    return { shouldComplete: true, endDate: null, coveredMonths };
  }
  const latestKey = latestCoveredMonthKey(input.invoices);
  const endDate = latestKey != null ? lastDateOfCoverageMonth(latestKey) : null;
  return { shouldComplete: true, endDate, coveredMonths };
}
