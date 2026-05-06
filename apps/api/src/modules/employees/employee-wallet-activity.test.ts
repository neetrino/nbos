import { describe, it, expect } from 'vitest';

import {
  mergeWalletActivityItems,
  type EmployeeWalletActivityItem,
} from './employee-wallet-activity';

describe('mergeWalletActivityItems', () => {
  it('sorts by occurredAt descending and caps length', () => {
    const items: EmployeeWalletActivityItem[] = [
      {
        id: 'a',
        kind: 'BONUS_RELEASE',
        occurredAt: '2026-01-01T00:00:00.000Z',
        title: 'Old',
        detail: null,
        linkHref: null,
      },
      {
        id: 'b',
        kind: 'SALARY_PAYMENT',
        occurredAt: '2026-06-01T00:00:00.000Z',
        title: 'New',
        detail: null,
        linkHref: null,
      },
    ];
    const merged = mergeWalletActivityItems(items);
    expect(merged[0].id).toBe('b');
    expect(merged[1].id).toBe('a');
  });
});
