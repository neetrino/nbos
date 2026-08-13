import { describe, expect, it } from 'vitest';
import type { Subscription, SubscriptionStats } from '@/lib/api/finance';
import { applyOptimisticSubscriptionStats } from './subscription-list-optimistic-stats';

const baseStats: SubscriptionStats = {
  total: 10,
  byStatus: [],
  byType: [],
  activeSubscriptions: 5,
  monthlyRevenue: 50_000,
};

function yearlySubscription(): Subscription {
  return {
    id: 'sub-yearly',
    code: 'SUB-Y',
    projectId: 'p1',
    productId: 'prod-1',
    type: 'MAINTENANCE_ONLY',
    amount: '120000',
    coverageMonthCount: 12,
    monthlyEquivalentAmount: '10000',
    billingFrequency: 'YEARLY',
    billingDay: 15,
    taxStatus: 'TAX',
    status: 'PENDING',
    termMonths: null,
    billingStartDate: '2026-01-15T00:00:00.000Z',
    notificationsEnabled: true,
    reminderLanguage: 'HY',
    endDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    project: { id: 'p1', code: 'P1', name: 'Project' },
    invoices: [],
  };
}

describe('applyOptimisticSubscriptionStats', () => {
  it('activating a yearly subscription adjusts MRR by monthly equivalent', () => {
    const subscription = yearlySubscription();
    const result = applyOptimisticSubscriptionStats(
      baseStats,
      subscription,
      undefined,
      'PENDING',
      'ACTIVE',
      Number(subscription.monthlyEquivalentAmount),
    );

    expect(result?.monthlyRevenue).toBe(60_000);
    expect(result?.activeSubscriptions).toBe(6);
  });

  it('does not add the full yearly period amount to monthlyRevenue', () => {
    const subscription = yearlySubscription();
    const result = applyOptimisticSubscriptionStats(
      baseStats,
      subscription,
      undefined,
      'PENDING',
      'ACTIVE',
      Number(subscription.amount),
    );

    expect(result?.monthlyRevenue).toBe(170_000);
    expect(result?.monthlyRevenue).not.toBe(60_000);
  });
});
