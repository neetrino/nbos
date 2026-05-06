import { describe, expect, it } from 'vitest';
import { buildPartnerListApiParams } from './build-partner-list-api-params';

describe('buildPartnerListApiParams', () => {
  it('omits paging keys', () => {
    const p = buildPartnerListApiParams({ search: '', filters: {} });
    expect(p).not.toHaveProperty('page');
    expect(p).not.toHaveProperty('pageSize');
  });

  it('passes filters when not all', () => {
    const p = buildPartnerListApiParams({
      search: 'Acme',
      filters: { status: 'ACTIVE', level: 'PREMIUM', direction: 'OUTBOUND' },
    });
    expect(p.search).toBe('Acme');
    expect(p.status).toBe('ACTIVE');
    expect(p.level).toBe('PREMIUM');
    expect(p.direction).toBe('OUTBOUND');
  });
});
