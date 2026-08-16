import { describe, expect, it } from 'vitest';
import { matchingSubscriptionBillingDays } from './subscription-billing-days';

describe('matchingSubscriptionBillingDays', () => {
  it('returns only the calendar day on a mid-month date', () => {
    expect(matchingSubscriptionBillingDays(new Date(2026, 2, 15))).toEqual([15]);
  });

  it('clamps overflow days on the last day of a short month', () => {
    expect(matchingSubscriptionBillingDays(new Date(2026, 1, 28))).toEqual([28, 29, 30, 31]);
  });

  it('includes day 31 on a 31-day month end without duplicating earlier days', () => {
    expect(matchingSubscriptionBillingDays(new Date(2026, 2, 31))).toEqual([31]);
  });

  it('clamps day 31 onto April 30', () => {
    expect(matchingSubscriptionBillingDays(new Date(2026, 3, 30))).toEqual([30, 31]);
  });

  it('does not select overflow days before month end', () => {
    expect(matchingSubscriptionBillingDays(new Date(2026, 1, 27))).toEqual([27]);
  });
});
