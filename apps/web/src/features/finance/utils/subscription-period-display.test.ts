import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  formatSubscriptionPeriodStatement,
  resolveSubscriptionNextPaymentDate,
} from './subscription-period-display';

function baseSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    code: 'SUB-001',
    projectId: 'p1',
    productId: 'prod-1',
    type: 'MAINTENANCE_ONLY',
    amount: '112000',
    coverageMonthCount: 12,
    monthlyEquivalentAmount: '9333.33',
    billingFrequency: 'YEARLY',
    billingDay: 24,
    taxStatus: 'TAX',
    status: 'ACTIVE',
    billingStartDate: '2026-04-24T00:00:00.000Z',
    notificationsEnabled: true,
    reminderLanguage: 'HY',
    endDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    project: { id: 'p1', code: 'P1', name: 'Project' },
    invoices: [],
    ...overrides,
  };
}

describe('formatSubscriptionPeriodStatement', () => {
  it('reads as a period statement with next payment', () => {
    const statement = formatSubscriptionPeriodStatement(baseSubscription());
    expect(statement).toContain('112');
    expect(statement).toContain('once a year');
    expect(statement).toContain('next payment');
  });

  it('describes monthly subscriptions', () => {
    const statement = formatSubscriptionPeriodStatement(
      baseSubscription({
        amount: '10000',
        coverageMonthCount: 1,
        billingFrequency: 'MONTHLY',
        billingStartDate: '2026-03-01T00:00:00.000Z',
      }),
    );
    expect(statement).toContain('once a month');
  });
});

describe('resolveSubscriptionNextPaymentDate', () => {
  it('returns null for cancelled subscriptions', () => {
    expect(
      resolveSubscriptionNextPaymentDate(baseSubscription({ status: 'CANCELLED' })),
    ).toBeNull();
  });
});
