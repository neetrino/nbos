import { describe, expect, it } from 'vitest';
import { SUBSCRIPTION_PARTNER_FILTER_UNLINKED } from '@nbos/shared';
import type { Subscription } from '@/lib/api/finance';
import { subscriptionMatchesPartnerStatsScope } from './subscription-partner-stats-scope';

function baseSub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 's1',
    code: 'SUB-1',
    projectId: 'p1',
    type: 'MONTHLY',
    amount: '100',
    billingDay: 1,
    taxStatus: 'TAXABLE',
    status: 'ACTIVE',
    startDate: '2026-01-01',
    endDate: null,
    createdAt: '2026-01-01',
    project: { id: 'p1', code: 'P', name: 'P' },
    invoices: [],
    ...overrides,
  };
}

describe('subscriptionMatchesPartnerStatsScope', () => {
  it('matches when stats have no partner scope', () => {
    expect(
      subscriptionMatchesPartnerStatsScope(baseSub({ partner: { id: 'x', name: 'X' } }), undefined),
    ).toBe(true);
  });

  it('matches unlinked scope only when subscription has no partner', () => {
    expect(
      subscriptionMatchesPartnerStatsScope(baseSub(), SUBSCRIPTION_PARTNER_FILTER_UNLINKED),
    ).toBe(true);
    expect(
      subscriptionMatchesPartnerStatsScope(
        baseSub({ partner: { id: 'p', name: 'P' } }),
        SUBSCRIPTION_PARTNER_FILTER_UNLINKED,
      ),
    ).toBe(false);
  });

  it('matches uuid scope to subscription.partner.id', () => {
    expect(
      subscriptionMatchesPartnerStatsScope(baseSub({ partner: { id: 'same', name: 'N' } }), 'same'),
    ).toBe(true);
    expect(
      subscriptionMatchesPartnerStatsScope(baseSub({ partner: { id: 'a', name: 'N' } }), 'b'),
    ).toBe(false);
  });
});
