import { describe, expect, it } from 'vitest';
import { buildExpenseListApiParams } from './build-expense-list-api-params';

describe('buildExpenseListApiParams', () => {
  it('maps filters, period, sort, and project scope', () => {
    const params = buildExpenseListApiParams({
      search: 'host',
      filters: { category: 'TOOLS', status: 'PAID', project: 'all' },
      period: 'month',
      effectiveProjectId: 'proj-1',
      sortBy: 'amount',
      sortOrder: 'asc',
    });
    expect(params.search).toBe('host');
    expect(params.category).toBe('TOOLS');
    expect(params.status).toBe('PAID');
    expect(params.projectId).toBe('proj-1');
    expect(params.sortBy).toBe('amount');
    expect(params.sortOrder).toBe('asc');
    expect(params.dateFrom).toBeDefined();
    expect(params.dateTo).toBeDefined();
  });

  it('omits category/status when set to all', () => {
    const params = buildExpenseListApiParams({
      search: '',
      filters: { category: 'all', status: 'all' },
      period: 'month',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(params.category).toBeUndefined();
    expect(params.status).toBeUndefined();
    expect(params.projectId).toBeUndefined();
  });
});
