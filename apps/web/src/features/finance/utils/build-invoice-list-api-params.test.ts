import { describe, expect, it } from 'vitest';
import { buildInvoiceListApiParams } from './build-invoice-list-api-params';

describe('buildInvoiceListApiParams', () => {
  it('omits status and type when set to all', () => {
    const p = buildInvoiceListApiParams({
      search: '',
      filters: { status: 'all', type: 'all' },
      subscriptionIdFromUrl: null,
      period: 'month',
    });
    expect(p.status).toBeUndefined();
    expect(p.type).toBeUndefined();
  });

  it('passes subscription and narrow filters', () => {
    const p = buildInvoiceListApiParams({
      search: '  ABC  ',
      filters: { status: 'PAID', type: 'STANDARD' },
      subscriptionIdFromUrl: 'sub-99',
      period: 'month',
    });
    expect(p.search).toBe('  ABC  ');
    expect(p.status).toBe('PAID');
    expect(p.type).toBe('STANDARD');
    expect(p.subscriptionId).toBe('sub-99');
  });
});
