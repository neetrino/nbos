import { describe, expect, it } from 'vitest';
import { buildSubscriptionPageQueries } from './build-subscription-page-queries';

describe('buildSubscriptionPageQueries', () => {
  it('mirrors partnerId from list query into stats params', () => {
    const { listQuery, statsParams } = buildSubscriptionPageQueries(
      {
        search: '',
        filters: { partner: 'p-1' },
        partnerIdFromUrl: null,
      },
      'month',
    );
    expect(listQuery.partnerId).toBe('p-1');
    expect(statsParams.partnerId).toBe('p-1');
  });

  it('omits partnerId in stats when list has none', () => {
    const { listQuery, statsParams } = buildSubscriptionPageQueries(
      {
        search: '',
        filters: {},
        partnerIdFromUrl: null,
      },
      'month',
    );
    expect(listQuery.partnerId).toBeUndefined();
    expect(statsParams.partnerId).toBeUndefined();
  });
});
