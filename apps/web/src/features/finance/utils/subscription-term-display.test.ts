import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  countSubscriptionDistinctCoveredMonths,
  deriveSubscriptionRemainingMonths,
  formatSubscriptionTermGridBadge,
  formatSubscriptionTermSummary,
} from './subscription-term-display';

function baseSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    code: 'SUB-001',
    name: 'Dev subscription',
    projectId: 'p1',
    productId: 'prod-1',
    type: 'DEV_ONLY',
    amount: '100000',
    coverageMonthCount: 1,
    monthlyEquivalentAmount: '100000',
    billingFrequency: 'MONTHLY',
    billingDay: 1,
    taxStatus: 'TAX',
    status: 'ACTIVE',
    termMonths: null,
    billingStartDate: '2026-01-01',
    notificationsEnabled: true,
    reminderLanguage: 'HY',
    endDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    project: { id: 'p1', code: 'P1', name: 'Project' },
    invoices: [],
    ...overrides,
  };
}

describe('subscription term display', () => {
  it('counts distinct covered months from invoice coverage windows', () => {
    const covered = countSubscriptionDistinctCoveredMonths([
      {
        id: 'i1',
        code: 'I1',
        moneyStatus: 'PAID',
        amount: '100',
        type: 'SUBSCRIPTION',
        coverageStartMonth: '2026-01',
        coverageMonthCount: 2,
      },
      {
        id: 'i2',
        code: 'I2',
        moneyStatus: 'PAID',
        amount: '100',
        type: 'SUBSCRIPTION',
        coverageStartMonth: '2026-03',
        coverageMonthCount: 1,
      },
    ]);
    expect(covered).toBe(3);
  });

  it('derives remaining months for fixed-term subscriptions', () => {
    const subscription = baseSubscription({
      termMonths: 6,
      invoices: [
        {
          id: 'i1',
          code: 'I1',
          moneyStatus: 'PAID',
          amount: '100',
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-01',
          coverageMonthCount: 2,
        },
      ],
    });
    expect(deriveSubscriptionRemainingMonths(subscription)).toBe(4);
    expect(formatSubscriptionTermSummary(subscription)).toBe('6-month term · 4 months remaining');
  });

  it('returns null summary for open-ended subscriptions', () => {
    expect(formatSubscriptionTermSummary(baseSubscription())).toBeNull();
    expect(formatSubscriptionTermGridBadge(6)).toBe('6 mo');
  });
});
