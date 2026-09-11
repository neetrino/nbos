import { describe, expect, it } from 'vitest';
import { subscriptionChargeAmount, subscriptionPrepaidCharge } from './subscription-billing-amount';

describe('subscriptionChargeAmount', () => {
  it('passes through period amount and coverage without multiplication', () => {
    expect(subscriptionChargeAmount(10_000, 1)).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
    expect(subscriptionChargeAmount(120_000, 12)).toEqual({
      amount: 120_000,
      coverageMonthCount: 12,
    });
    expect(subscriptionChargeAmount(40_000, 4)).toEqual({
      amount: 40_000,
      coverageMonthCount: 4,
    });
  });

  it('falls back to one month when coverageMonthCount is invalid', () => {
    expect(subscriptionChargeAmount(10_000, 0)).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
    expect(subscriptionChargeAmount(10_000, 2.5)).toEqual({
      amount: 10_000,
      coverageMonthCount: 1,
    });
  });
});

describe('subscriptionPrepaidCharge', () => {
  it('multiplies period amount and coverage by the selected period count', () => {
    expect(subscriptionPrepaidCharge(50_000, 1, 3)).toEqual({
      amount: 150_000,
      coverageMonthCount: 3,
    });
    expect(subscriptionPrepaidCharge(120_000, 12, 2)).toEqual({
      amount: 240_000,
      coverageMonthCount: 24,
    });
  });
});
