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

  it('uses prepaidMonthCount for custom billing', () => {
    expect(subscriptionChargeAmount(10_000, 'CUSTOM', 4)).toEqual({
      amount: 40_000,
      coverageMonthCount: 4,
    });
  });

  it('falls back to one month when custom prepaidMonthCount is null or invalid', () => {
    expect(subscriptionChargeAmount(10_000, 'CUSTOM', null)).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
    expect(subscriptionChargeAmount(10_000, 'CUSTOM', 0)).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
    expect(subscriptionChargeAmount(10_000, 'CUSTOM', 2.5)).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
  });
});
