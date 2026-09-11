import { describe, expect, it } from 'vitest';
import type { SubscriptionGridCell, SubscriptionGridRow } from '@/lib/api/finance';
import {
  sortSubscriptionGridRows,
  subscriptionCalendarMonthLabels,
} from './subscription-grid-utils';

function emptyMonths(): SubscriptionGridCell[] {
  return Array.from({ length: 12 }, () => ({
    kind: 'NA',
    invoiceId: null,
    displayAmount: null,
  }));
}

function row(
  partial: Pick<SubscriptionGridRow, 'subscriptionId' | 'subscriptionName' | 'amountMonthly'>,
): SubscriptionGridRow {
  return {
    projectId: 'p1',
    projectName: 'P',
    subscriptionType: 'MAINTENANCE',
    subscriptionStatus: 'ACTIVE',
    months: emptyMonths(),
    annualTotal: partial.amountMonthly * 12,
    ...partial,
  };
}

describe('subscriptionCalendarMonthLabels', () => {
  it('returns 12 short English month names', () => {
    const labels = subscriptionCalendarMonthLabels(2026);
    expect(labels).toHaveLength(12);
    expect(labels[0]).toEqual({ key: 0, label: 'Jan' });
    expect(labels[11]).toEqual({ key: 11, label: 'Dec' });
  });
});

describe('sortSubscriptionGridRows', () => {
  it('sorts by monthly amount then name', () => {
    const sorted = sortSubscriptionGridRows([
      row({ subscriptionId: 'b', subscriptionName: 'Beta', amountMonthly: 2000 }),
      row({ subscriptionId: 'a', subscriptionName: 'Alpha', amountMonthly: 1000 }),
      row({ subscriptionId: 'c', subscriptionName: 'Gamma', amountMonthly: 1000 }),
    ]);
    expect(sorted.map((item) => item.subscriptionId)).toEqual(['a', 'c', 'b']);
  });
});
