import { describe, expect, it } from 'vitest';
import { buildInvoiceListApiParams } from './build-invoice-list-api-params';

describe('buildInvoiceListApiParams', () => {
  it('omits moneyStatus and type when set to all', () => {
    const p = buildInvoiceListApiParams({
      search: '',
      filters: { moneyStatus: 'all', type: 'all' },
      subscriptionIdFromUrl: null,
      period: 'month',
    });
    expect(p.moneyStatus).toBeUndefined();
    expect(p.type).toBeUndefined();
  });

  it('passes subscription and narrow filters', () => {
    const p = buildInvoiceListApiParams({
      search: '  ABC  ',
      filters: { moneyStatus: 'OVERDUE', type: 'STANDARD' },
      subscriptionIdFromUrl: 'sub-99',
      period: 'month',
    });
    expect(p.search).toBe('  ABC  ');
    expect(p.moneyStatus).toBe('OVERDUE');
    expect(p.type).toBe('STANDARD');
    expect(p.subscriptionId).toBe('sub-99');
  });
});
