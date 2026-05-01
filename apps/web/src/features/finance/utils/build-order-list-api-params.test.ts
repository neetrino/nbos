import { describe, expect, it } from 'vitest';
import { buildOrderListApiParams } from './build-order-list-api-params';

describe('buildOrderListApiParams', () => {
  it('omits paging keys', () => {
    const p = buildOrderListApiParams({
      search: '',
      filters: {},
      partnerIdFromUrl: null,
      period: 'month',
      gap: null,
    });
    expect(p).not.toHaveProperty('page');
    expect(p).not.toHaveProperty('pageSize');
  });

  it('includes partner, gap, and status when set', () => {
    const p = buildOrderListApiParams({
      search: 'ORD',
      filters: { status: 'OPEN' },
      partnerIdFromUrl: 'par-1',
      period: 'all',
      gap: 'uninvoiced',
    });
    expect(p.search).toBe('ORD');
    expect(p.status).toBe('OPEN');
    expect(p.partnerId).toBe('par-1');
    expect(p.gap).toBe('uninvoiced');
  });

  it('drops status when filter is all', () => {
    const p = buildOrderListApiParams({
      search: '',
      filters: { status: 'all' },
      partnerIdFromUrl: null,
      period: 'all',
      gap: null,
    });
    expect(p.status).toBeUndefined();
  });
});
