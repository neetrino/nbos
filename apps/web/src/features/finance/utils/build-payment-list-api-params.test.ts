import { describe, expect, it } from 'vitest';
import { buildPaymentListApiParams } from './build-payment-list-api-params';

describe('buildPaymentListApiParams', () => {
  it('omits paging keys', () => {
    const p = buildPaymentListApiParams({ search: '', period: 'month' });
    expect(p).not.toHaveProperty('page');
    expect(p).not.toHaveProperty('pageSize');
  });

  it('includes search when non-empty', () => {
    const p = buildPaymentListApiParams({ search: ' INV-1 ', period: 'all' });
    expect(p.search).toBe(' INV-1 ');
  });

  it('adds date range when period is not all', () => {
    const p = buildPaymentListApiParams({ search: '', period: 'month' });
    expect(p.dateFrom).toBeDefined();
    expect(p.dateTo).toBeDefined();
  });
});
