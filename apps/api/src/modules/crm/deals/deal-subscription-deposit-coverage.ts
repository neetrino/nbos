import { Decimal } from '@nbos/database';

/**
 * Prisma `Invoice.amount` / `Subscription.amount` are `Decimal(12, 2)`.
 * Operands are quantized to that scale before comparing so IEEE-754 equality is never used.
 */
export const INVOICE_MONEY_DECIMAL_PLACES = 2;

/**
 * Allowed remainder after dividing the deposit by the period price, at stored money scale.
 * Zero: a 1-cent shortfall is a partial / rounded-down advance, not a whole period.
 */
export const DEPOSIT_PERIOD_AMOUNT_TOLERANCE = new Decimal('0');

/** Route A auto-create always bills monthly: one calendar month per period. */
export const ROUTE_A_PERIOD_COVERAGE_MONTH_COUNT = 1;

const MIN_WHOLE_DEPOSIT_PERIODS = 1;

export function toStoredMoneyDecimal(value: unknown): Decimal | null {
  if (typeof value !== 'number' && typeof value !== 'string' && !(value instanceof Decimal)) {
    return null;
  }
  try {
    const parsed = new Decimal(value);
    if (!parsed.isFinite()) {
      return null;
    }
    return parsed.toDecimalPlaces(INVOICE_MONEY_DECIMAL_PLACES, Decimal.ROUND_HALF_UP);
  } catch {
    return null;
  }
}

/**
 * How many coverage months the deposit pays for, or `null` when the amount is not
 * an exact whole multiple of the subscription period price.
 *
 * One period price → `periodCoverageMonthCount`; N period prices → N × that count.
 */
export function resolveDepositCoverageMonthCount(input: {
  invoiceAmount: unknown;
  periodAmount: unknown;
  periodCoverageMonthCount: number;
}): number | null {
  if (
    !Number.isInteger(input.periodCoverageMonthCount) ||
    input.periodCoverageMonthCount < MIN_WHOLE_DEPOSIT_PERIODS
  ) {
    return null;
  }
  const invoice = toStoredMoneyDecimal(input.invoiceAmount);
  const period = toStoredMoneyDecimal(input.periodAmount);
  if (invoice == null || period == null || period.lte(0) || invoice.lte(0)) {
    return null;
  }
  const wholePeriods = invoice.div(period).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  if (wholePeriods.lt(MIN_WHOLE_DEPOSIT_PERIODS)) {
    return null;
  }
  const remainder = invoice.minus(period.times(wholePeriods)).abs();
  if (remainder.gt(DEPOSIT_PERIOD_AMOUNT_TOLERANCE)) {
    return null;
  }
  return wholePeriods.times(input.periodCoverageMonthCount).toNumber();
}

export function formatUnlinkedDepositAmountWarning(
  dealCode: string,
  invoiceRef: string,
  invoiceAmount: unknown,
  periodAmount: unknown,
): string {
  const invoiceLabel = toStoredMoneyDecimal(invoiceAmount)?.toFixed(INVOICE_MONEY_DECIMAL_PLACES);
  const periodLabel = toStoredMoneyDecimal(periodAmount)?.toFixed(INVOICE_MONEY_DECIMAL_PLACES);
  return (
    `Deal ${dealCode}: deposit invoice ${invoiceRef} amount ${invoiceLabel ?? String(invoiceAmount)} ` +
    `does not match whole periods of subscription amount ${periodLabel ?? String(periodAmount)}; ` +
    `leaving unlinked`
  );
}
