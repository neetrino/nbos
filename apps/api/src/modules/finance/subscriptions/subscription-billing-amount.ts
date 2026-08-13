import type { SubscriptionBillingFrequencyEnum } from '@nbos/database';

const YEARLY_COVERAGE_MONTHS = 12;
const MONTHLY_COVERAGE_MONTHS = 1;

export interface SubscriptionChargeAmount {
  amount: number;
  coverageMonthCount: number;
}

/**
 * Invoice amount and coverage from subscription billing fields (NBOS § Subscriptions).
 * CUSTOM uses `prepaidMonthCount`; null/invalid falls back to one month (cron-safe).
 */
export function subscriptionChargeAmount(
  baseMonthlyAmount: number,
  billingFrequency: SubscriptionBillingFrequencyEnum,
  prepaidMonthCount?: number | null,
): SubscriptionChargeAmount {
  const base = Number.isFinite(baseMonthlyAmount) ? baseMonthlyAmount : 0;
  if (billingFrequency === 'YEARLY') {
    return {
      amount: base * YEARLY_COVERAGE_MONTHS,
      coverageMonthCount: YEARLY_COVERAGE_MONTHS,
    };
  }
  if (billingFrequency === 'CUSTOM') {
    const months = resolveCustomPrepaidMonths(prepaidMonthCount);
    return { amount: base * months, coverageMonthCount: months };
  }
  return { amount: base, coverageMonthCount: MONTHLY_COVERAGE_MONTHS };
}

function resolveCustomPrepaidMonths(prepaidMonthCount: number | null | undefined): number {
  if (prepaidMonthCount == null || !Number.isInteger(prepaidMonthCount) || prepaidMonthCount < 1) {
    return MONTHLY_COVERAGE_MONTHS;
  }
  return prepaidMonthCount;
}
