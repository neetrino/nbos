import { describe, expect, it } from 'vitest';
import { buildSubscriptionsCsvContent } from './export-subscriptions-csv';
import type { Subscription } from '@/lib/api/subscriptions';

function minimalSubscription(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub-1',
    code: 'SUB-001',
    projectId: 'p1',
    type: 'MONTHLY',
    amount: '100.00',
    billingDay: 1,
    taxStatus: 'TAX',
    status: 'ACTIVE',
    startDate: '2026-01-01',
    endDate: null,
    createdAt: '2026-04-28T12:00:00.000Z',
    project: { id: 'p1', code: 'PRJ', name: 'Alpha' },
    company: null,
    contact: null,
    partner: null,
    invoices: [],
    coverage: {
      firstCoveredMonth: 1,
      activeMonthCount: 3,
      annualizedAmount: 1200,
    },
    ...overrides,
  };
}

describe('buildSubscriptionsCsvContent', () => {
  it('header only when empty', () => {
    const csv = buildSubscriptionsCsvContent([]);
    expect(csv.split('\r\n')).toHaveLength(1);
    expect(csv).toContain('coverageAnnualizedAmount');
  });

  it('escapes project name with comma', () => {
    const csv = buildSubscriptionsCsvContent([
      minimalSubscription({ project: { id: 'p1', code: 'C', name: 'A, B' } }),
    ]);
    expect(csv).toContain('"A, B"');
  });

  it('appends grand total for amount and roll-ups', () => {
    const csv = buildSubscriptionsCsvContent([
      minimalSubscription({
        id: 'a',
        amount: '10.00',
        invoices: [{ id: 'i1', code: 'I1', status: 'DRAFT', amount: '1' }],
        coverage: { firstCoveredMonth: 1, activeMonthCount: 2, annualizedAmount: 100 },
      }),
      minimalSubscription({
        id: 'b',
        code: 'SUB-B',
        amount: '20.50',
        invoices: [],
        coverage: { firstCoveredMonth: 2, activeMonthCount: 1, annualizedAmount: 50.25 },
      }),
    ]);
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toContain('_grand_total');
    expect(lines[3]).toContain('All subscriptions (2)');
    expect(lines[3]).toContain('30.50');
    expect(lines[3]).toContain('150.25');
  });
});
