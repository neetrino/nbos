import { describe, expect, it } from 'vitest';
import type { Subscription } from '@/lib/api/subscriptions';
import {
  defaultSubscriptionInvoiceMonth,
  formatSubscriptionInvoiceMonthLabel,
  listEligibleSubscriptionInvoiceMonths,
} from './subscription-invoice-months';

function baseSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    code: 'SUB-001',
    name: 'Maintenance',
    projectId: 'p1',
    productId: 'prod-1',
    type: 'MAINTENANCE_ONLY',
    amount: '80000',
    coverageMonthCount: 1,
    monthlyEquivalentAmount: '80000',
    billingFrequency: 'MONTHLY',
    billingDay: 10,
    taxStatus: 'TAX',
    status: 'ACTIVE',
    termMonths: null,
    billingStartDate: '2026-08-01T00:00:00.000Z',
    notificationsEnabled: true,
    reminderLanguage: 'HY',
    endDate: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    project: { id: 'p1', code: 'P1', name: 'Project' },
    invoices: [],
    ...overrides,
  };
}

const midSeptember = new Date('2026-09-15T10:00:00+04:00');

describe('listEligibleSubscriptionInvoiceMonths', () => {
  it('lists uncovered months from billing start through next month', () => {
    expect(listEligibleSubscriptionInvoiceMonths(baseSubscription(), midSeptember)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
  });

  it('drops months already covered by an invoice', () => {
    const subscription = baseSubscription({
      invoices: [
        {
          id: 'inv-1',
          code: 'INV-1',
          moneyStatus: 'NEW',
          amount: '80000',
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-09',
          coverageMonthCount: 1,
        },
      ],
    });
    expect(listEligibleSubscriptionInvoiceMonths(subscription, midSeptember)).toEqual([
      '2026-08',
      '2026-10',
    ]);
  });

  it('returns no months unless the subscription is active', () => {
    expect(
      listEligibleSubscriptionInvoiceMonths(baseSubscription({ status: 'PENDING' }), midSeptember),
    ).toEqual([]);
  });

  it('stops at the subscription end month', () => {
    expect(
      listEligibleSubscriptionInvoiceMonths(
        baseSubscription({ endDate: '2026-09-20T00:00:00.000Z' }),
        midSeptember,
      ),
    ).toEqual(['2026-08', '2026-09']);
  });

  it('drops start months whose multi-month window overlaps an existing card', () => {
    const subscription = baseSubscription({
      coverageMonthCount: 12,
      billingFrequency: 'YEARLY',
      invoices: [
        {
          id: 'inv-1',
          code: 'INV-1',
          moneyStatus: 'NEW',
          amount: '80000',
          type: 'SUBSCRIPTION',
          coverageStartMonth: '2026-08',
          coverageMonthCount: 12,
        },
      ],
    });
    expect(listEligibleSubscriptionInvoiceMonths(subscription, midSeptember)).toEqual([]);
  });

  it('returns no months when remaining term is shorter than the billing period', () => {
    expect(
      listEligibleSubscriptionInvoiceMonths(
        baseSubscription({
          termMonths: 12,
          coverageMonthCount: 12,
          invoices: [
            {
              id: 'inv-1',
              code: 'INV-1',
              moneyStatus: 'PAID',
              amount: '80000',
              type: 'SUBSCRIPTION',
              coverageStartMonth: '2025-08',
              coverageMonthCount: 12,
            },
          ],
        }),
        midSeptember,
      ),
    ).toEqual([]);
  });
});

describe('defaultSubscriptionInvoiceMonth', () => {
  it('prefers the current Yerevan month, then next, then the latest eligible', () => {
    expect(defaultSubscriptionInvoiceMonth(['2026-08', '2026-09', '2026-10'], midSeptember)).toBe(
      '2026-09',
    );
    expect(defaultSubscriptionInvoiceMonth(['2026-08', '2026-10'], midSeptember)).toBe('2026-10');
    expect(defaultSubscriptionInvoiceMonth(['2026-08'], midSeptember)).toBe('2026-08');
  });
});

describe('formatSubscriptionInvoiceMonthLabel', () => {
  it('formats a coverage month', () => {
    expect(formatSubscriptionInvoiceMonthLabel('2026-09', 'en')).toMatch(/September/);
    expect(formatSubscriptionInvoiceMonthLabel('2026-09', 'en')).toMatch(/2026/);
  });
});
