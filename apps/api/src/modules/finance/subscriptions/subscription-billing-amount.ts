const MONTHLY_COVERAGE_MONTHS = 1;

export interface SubscriptionChargeAmount {
  amount: number;
  coverageMonthCount: number;
}

/**
 * Invoice amount and coverage from subscription billing fields (NBOS § Subscriptions).
 * Invoice amount equals period `amount` with no multiplication; coverage comes from
 * `coverageMonthCount`. Invalid coverage falls back to one month (cron-safe).
 */
export function subscriptionChargeAmount(
  amount: number,
  coverageMonthCount: number,
): SubscriptionChargeAmount {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const months =
    Number.isInteger(coverageMonthCount) && coverageMonthCount >= 1
      ? coverageMonthCount
      : MONTHLY_COVERAGE_MONTHS;
  return { amount: safeAmount, coverageMonthCount: months };
}

/**
 * One-off prepaid card: period charge × selected period count.
 * Regular billing still uses `subscriptionChargeAmount` with no multiplication.
 */
export function subscriptionPrepaidCharge(
  periodAmount: number,
  periodCoverageMonthCount: number,
  periodCount: number,
): SubscriptionChargeAmount {
  const period = subscriptionChargeAmount(periodAmount, periodCoverageMonthCount);
  const count = Number.isInteger(periodCount) && periodCount >= 1 ? periodCount : 1;
  return {
    amount: period.amount * count,
    coverageMonthCount: period.coverageMonthCount * count,
  };
}
