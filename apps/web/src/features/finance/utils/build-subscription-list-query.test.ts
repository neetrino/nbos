import { describe, expect, it } from 'vitest';
import { buildSubscriptionListQuery } from './build-subscription-list-query';

describe('buildSubscriptionListQuery', () => {
  it('uses partner filter when set', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: { partner: 'p1' },
      partnerIdFromUrl: 'p2',
    });
    expect(q.partnerId).toBe('p1');
  });

  it('falls back to partnerId from URL when filter is all', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: { partner: 'all' },
      partnerIdFromUrl: 'p-url',
    });
    expect(q.partnerId).toBe('p-url');
  });

  it('uses URL partner when filter absent', () => {
    const q = buildSubscriptionListQuery({
      search: '',
      filters: {},
      partnerIdFromUrl: 'p-url',
    });
    expect(q.partnerId).toBe('p-url');
  });
});
