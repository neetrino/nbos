import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/finance';
import {
  buildSubscriptionCreatePayload,
  buildSubscriptionUpdatePayload,
  EMPTY_SUBSCRIPTION_FORM,
  getSubscriptionBillingValidationError,
  parsePrepaidMonthCount,
  subscriptionToFormState,
} from './subscription-form-state';

const baseSubscription: Subscription = {
  id: 'sub-1',
  code: 'SUB-001',
  projectId: 'proj-1',
  productId: 'prod-1',
  type: 'MAINTENANCE_ONLY',
  baseMonthlyAmount: '10000',
  billingFrequency: 'MONTHLY',
  billingDay: 15,
  taxStatus: 'TAX',
  status: 'ACTIVE',
  billingStartDate: '2026-01-15T00:00:00.000Z',
  notificationsEnabled: true,
  reminderLanguage: 'HY',
  endDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  project: { id: 'proj-1', code: 'P1', name: 'Project One' },
  invoices: [],
};

describe('parsePrepaidMonthCount', () => {
  it('accepts integers in the allowed range', () => {
    expect(parsePrepaidMonthCount('2')).toBe(2);
    expect(parsePrepaidMonthCount('60')).toBe(60);
  });

  it('rejects out-of-range and non-integer values', () => {
    expect(parsePrepaidMonthCount('')).toBeNull();
    expect(parsePrepaidMonthCount('1')).toBeNull();
    expect(parsePrepaidMonthCount('61')).toBeNull();
    expect(parsePrepaidMonthCount('4.5')).toBeNull();
  });
});

describe('getSubscriptionBillingValidationError', () => {
  it('requires prepaid months for custom billing', () => {
    expect(
      getSubscriptionBillingValidationError({
        billingFrequency: 'CUSTOM',
        prepaidMonthCount: '',
      }),
    ).toMatch(/required/i);
    expect(
      getSubscriptionBillingValidationError({
        billingFrequency: 'CUSTOM',
        prepaidMonthCount: '4',
      }),
    ).toBeNull();
  });

  it('skips validation for monthly and yearly', () => {
    expect(
      getSubscriptionBillingValidationError({
        billingFrequency: 'MONTHLY',
        prepaidMonthCount: '',
      }),
    ).toBeNull();
  });
});

describe('subscriptionToFormState', () => {
  it('maps prepaidMonthCount for custom subscriptions', () => {
    const form = subscriptionToFormState({
      ...baseSubscription,
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 6,
    });
    expect(form.prepaidMonthCount).toBe('6');
  });

  it('uses empty string when prepaidMonthCount is null', () => {
    const form = subscriptionToFormState({
      ...baseSubscription,
      billingFrequency: 'MONTHLY',
      prepaidMonthCount: null,
    });
    expect(form.prepaidMonthCount).toBe('');
  });
});

describe('buildSubscriptionCreatePayload', () => {
  it('includes prepaidMonthCount only for custom billing', () => {
    const customPayload = buildSubscriptionCreatePayload({
      ...EMPTY_SUBSCRIPTION_FORM,
      productId: 'prod-1',
      baseMonthlyAmount: '10000',
      billingStartDate: '2026-03-01',
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: '4',
    });
    expect(customPayload).toMatchObject({
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 4,
    });

    const monthlyPayload = buildSubscriptionCreatePayload({
      ...EMPTY_SUBSCRIPTION_FORM,
      productId: 'prod-1',
      baseMonthlyAmount: '10000',
      billingStartDate: '2026-03-01',
      billingFrequency: 'MONTHLY',
      prepaidMonthCount: '4',
    });
    expect(monthlyPayload).not.toHaveProperty('prepaidMonthCount');
  });
});

describe('buildSubscriptionUpdatePayload', () => {
  it('omits prepaidMonthCount for monthly billing', () => {
    const payload = buildSubscriptionUpdatePayload({
      ...subscriptionToFormState(baseSubscription),
      billingFrequency: 'YEARLY',
      prepaidMonthCount: '',
    });
    expect(payload).toMatchObject({ billingFrequency: 'YEARLY' });
    expect(payload).not.toHaveProperty('prepaidMonthCount');
  });

  it('includes prepaidMonthCount for custom billing', () => {
    const payload = buildSubscriptionUpdatePayload({
      ...subscriptionToFormState({
        ...baseSubscription,
        billingFrequency: 'CUSTOM',
        prepaidMonthCount: 12,
      }),
      prepaidMonthCount: '12',
    });
    expect(payload).toMatchObject({
      billingFrequency: 'CUSTOM',
      prepaidMonthCount: 12,
    });
  });
});
