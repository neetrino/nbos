import { describe, expect, it } from 'vitest';
import {
  applyBillingPeriodChangeToDraft,
  computePeriodAmountFromMonthlyEquivalent,
  hasSubscriptionBillingPeriodChanged,
} from './subscription-billing-period-change';
import { EMPTY_SUBSCRIPTION_FORM } from './subscription-form-state';

describe('computePeriodAmountFromMonthlyEquivalent', () => {
  it('proposes yearly amount from monthly equivalent', () => {
    expect(computePeriodAmountFromMonthlyEquivalent(10_000, 'YEARLY', '')).toBe(120_000);
  });

  it('proposes custom period amount from monthly equivalent', () => {
    expect(computePeriodAmountFromMonthlyEquivalent(10_000, 'CUSTOM', '4')).toBe(40_000);
  });
});

describe('hasSubscriptionBillingPeriodChanged', () => {
  it('detects frequency and custom coverage changes', () => {
    const snap = {
      ...EMPTY_SUBSCRIPTION_FORM,
      billingFrequency: 'MONTHLY',
      coverageMonthCount: '',
    };
    expect(hasSubscriptionBillingPeriodChanged(snap, { ...snap, billingFrequency: 'YEARLY' })).toBe(
      true,
    );
    expect(
      hasSubscriptionBillingPeriodChanged(
        { ...snap, billingFrequency: 'CUSTOM', coverageMonthCount: '4' },
        { ...snap, billingFrequency: 'CUSTOM', coverageMonthCount: '6' },
      ),
    ).toBe(true);
  });
});

describe('applyBillingPeriodChangeToDraft', () => {
  it('recomputes amount when switching monthly to yearly', () => {
    const draft = {
      ...EMPTY_SUBSCRIPTION_FORM,
      amount: '10000',
      billingFrequency: 'MONTHLY',
    };
    const next = applyBillingPeriodChangeToDraft(draft, { billingFrequency: 'YEARLY' }, 10_000);
    expect(next.billingFrequency).toBe('YEARLY');
    expect(next.amount).toBe('120000');
  });
});
