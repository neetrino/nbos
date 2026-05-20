import { describe, expect, it } from 'vitest';
import { subscriptionChargeAmount } from './subscription-billing-amount';

describe('subscriptionChargeAmount', () => {
  it('uses one month for monthly billing', () => {
    expect(subscriptionChargeAmount(10_000, 'MONTHLY')).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
  });

  it('uses twelve months for yearly billing', () => {
    expect(subscriptionChargeAmount(10_000, 'YEARLY')).toEqual({
      amount: 120_000,
      coverageMonthCount: 12,
    });
  });
});
