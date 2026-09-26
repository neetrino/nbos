import { Decimal } from '@nbos/database';
import {
  ROUTE_A_PERIOD_COVERAGE_MONTH_COUNT,
  resolveDepositCoverageMonthCount,
} from '../crm/deals/deal-subscription-deposit-coverage';

const BONUS_MONEY_DECIMAL_PLACES = 2;

/**
 * Sales-bonus base for `SUBSCRIPTION_FIRST_MONTH`: one month of the first paid invoice.
 * A multi-month prepayment still pays seller and assistant once, from a single month.
 * Stored `coverageMonthCount` wins. Before Deal Won links coverage, Route A derives
 * months from Deal.amount (one monthly period).
 */
export function subscriptionFirstMonthBonusBase(input: {
  invoiceAmount: Decimal;
  coverageMonthCount: number | null;
  periodAmount: Decimal | null;
}): Decimal {
  const months = resolveFirstPaidInvoiceMonths(input);
  if (months <= 1) {
    return input.invoiceAmount;
  }
  return input.invoiceAmount
    .div(months)
    .toDecimalPlaces(BONUS_MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
}

function resolveFirstPaidInvoiceMonths(input: {
  invoiceAmount: Decimal;
  coverageMonthCount: number | null;
  periodAmount: Decimal | null;
}): number {
  const stored = input.coverageMonthCount;
  if (stored != null && Number.isInteger(stored) && stored >= 1) {
    return stored;
  }
  if (input.periodAmount == null || input.periodAmount.lte(0)) {
    return 1;
  }
  return (
    resolveDepositCoverageMonthCount({
      invoiceAmount: input.invoiceAmount,
      periodAmount: input.periodAmount,
      periodCoverageMonthCount: ROUTE_A_PERIOD_COVERAGE_MONTH_COUNT,
    }) ?? 1
  );
}
