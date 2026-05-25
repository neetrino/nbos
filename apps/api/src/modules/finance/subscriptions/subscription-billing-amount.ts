import type { SubscriptionBillingFrequencyEnum } from '@nbos/database';

const YEARLY_COVERAGE_MONTHS = 12;
const MONTHLY_COVERAGE_MONTHS = 1;

export interface SubscriptionChargeAmount {
  amount: number;
  coverageMonthCount: number;
}

/** Invoice amount and coverage from subscription billing fields (NBOS § Subscriptions). */
export function subscriptionChargeAmount(
  baseMonthlyAmount: number,
  billingFrequency: SubscriptionBillingFrequencyEnum,
): SubscriptionChargeAmount {
  const base = Number.isFinite(baseMonthlyAmount) ? baseMonthlyAmount : 0;
  if (billingFrequency === 'YEARLY') {
    return {
      amount: base * YEARLY_COVERAGE_MONTHS,
      coverageMonthCount: YEARLY_COVERAGE_MONTHS,
    };
  }
  return { amount: base, coverageMonthCount: MONTHLY_COVERAGE_MONTHS };
}
