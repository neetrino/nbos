import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/finance';
import {
  buildSubscriptionCreatePayload,
  buildSubscriptionUpdatePayload,
  EMPTY_SUBSCRIPTION_FORM,
  getSubscriptionBillingValidationError,
  getSubscriptionPeriodAmountLabel,
  parseCoverageMonthCount,
  subscriptionToFormState,
} from './subscription-form-state';

const baseSubscription: Subscription = {
  id: 'sub-1',
  code: 'SUB-001',
  projectId: 'proj-1',
  productId: 'prod-1',
  type: 'MAINTENANCE_ONLY',
  amount: '10000',
  coverageMonthCount: 1,
  monthlyEquivalentAmount: '10000',
  billingFrequency: 'MONTHLY',
  billingDay: 15,
  taxStatus: 'TAX',
  status: 'ACTIVE',
  termMonths: null,
  billingStartDate: '2026-01-15T00:00:00.000Z',
  notificationsEnabled: true,
  reminderLanguage: 'HY',
  endDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  project: { id: 'proj-1', code: 'P1', name: 'Project One' },
  invoices: [],
};

describe('getSubscriptionPeriodAmountLabel', () => {
  it('reflects the selected billing period', () => {
    expect(getSubscriptionPeriodAmountLabel('MONTHLY')).toBe('Amount / month');
    expect(getSubscriptionPeriodAmountLabel('YEARLY')).toBe('Amount / year');
    expect(getSubscriptionPeriodAmountLabel('CUSTOM')).toBe('Amount for period');
  });
});

describe('parseCoverageMonthCount', () => {
  it('accepts integers in the allowed range', () => {
    expect(parseCoverageMonthCount('2')).toBe(2);
    expect(parseCoverageMonthCount('60')).toBe(60);
  });

  it('rejects out-of-range and non-integer values', () => {
    expect(parseCoverageMonthCount('')).toBeNull();
    expect(parseCoverageMonthCount('1')).toBeNull();
    expect(parseCoverageMonthCount('61')).toBeNull();
    expect(parseCoverageMonthCount('4.5')).toBeNull();
  });
});

describe('getSubscriptionBillingValidationError', () => {
  it('requires coverage months for custom billing', () => {
    expect(
      getSubscriptionBillingValidationError({
        billingFrequency: 'CUSTOM',
        coverageMonthCount: '',
      }),
    ).toMatch(/required/i);
    expect(
      getSubscriptionBillingValidationError({
        billingFrequency: 'CUSTOM',
        coverageMonthCount: '4',
      }),
    ).toBeNull();
  });

  it('skips validation for monthly and yearly', () => {
    expect(
      getSubscriptionBillingValidationError({
        billingFrequency: 'MONTHLY',
        coverageMonthCount: '',
      }),
    ).toBeNull();
  });
});

describe('subscriptionToFormState', () => {
  it('maps coverageMonthCount for custom subscriptions', () => {
    const form = subscriptionToFormState({
      ...baseSubscription,
      billingFrequency: 'CUSTOM',
      coverageMonthCount: 6,
      monthlyEquivalentAmount: '1666.67',
      amount: '10000',
    });
    expect(form.coverageMonthCount).toBe('6');
  });

  it('uses empty string for coverageMonthCount when not custom', () => {
    const form = subscriptionToFormState({
      ...baseSubscription,
      billingFrequency: 'MONTHLY',
      coverageMonthCount: 1,
    });
    expect(form.coverageMonthCount).toBe('');
  });
});

describe('buildSubscriptionCreatePayload', () => {
  it('includes coverageMonthCount only for custom billing', () => {
    const customPayload = buildSubscriptionCreatePayload({
      ...EMPTY_SUBSCRIPTION_FORM,
      productId: 'prod-1',
      amount: '40000',
      billingStartDate: '2026-03-01',
      billingFrequency: 'CUSTOM',
      coverageMonthCount: '4',
    });
    expect(customPayload).toMatchObject({
      billingFrequency: 'CUSTOM',
      amount: 40000,
      coverageMonthCount: 4,
    });

    const monthlyPayload = buildSubscriptionCreatePayload({
      ...EMPTY_SUBSCRIPTION_FORM,
      productId: 'prod-1',
      amount: '10000',
      billingStartDate: '2026-03-01',
      billingFrequency: 'MONTHLY',
      coverageMonthCount: '4',
    });
    expect(monthlyPayload).not.toHaveProperty('coverageMonthCount');
  });
});

describe('buildSubscriptionUpdatePayload', () => {
  it('omits coverageMonthCount for monthly billing', () => {
    const payload = buildSubscriptionUpdatePayload({
      ...subscriptionToFormState(baseSubscription),
      billingFrequency: 'YEARLY',
      coverageMonthCount: '',
    });
    expect(payload).toMatchObject({ billingFrequency: 'YEARLY' });
    expect(payload).not.toHaveProperty('coverageMonthCount');
  });

  it('includes coverageMonthCount for custom billing', () => {
    const payload = buildSubscriptionUpdatePayload({
      ...subscriptionToFormState({
        ...baseSubscription,
        billingFrequency: 'CUSTOM',
        coverageMonthCount: 12,
        amount: '120000',
        monthlyEquivalentAmount: '10000',
      }),
      coverageMonthCount: '12',
    });
    expect(payload).toMatchObject({
      billingFrequency: 'CUSTOM',
      coverageMonthCount: 12,
    });
  });
});
