import { describe, expect, it } from 'vitest';
import {
  buildExpenseListApiParams,
  pickExpenseStatsQueryParams,
} from './build-expense-list-api-params';

describe('buildExpenseListApiParams', () => {
  it('maps filters, period, sort, and project scope', () => {
    const params = buildExpenseListApiParams({
      search: 'host',
      filters: { category: 'TOOLS', status: 'PAID', project: 'all' },
      period: 'month',
      effectiveProjectId: 'proj-1',
      sortBy: 'amount',
      sortOrder: 'asc',
      pageVariant: 'default',
    });
    expect(params.search).toBe('host');
    expect(params.category).toBe('TOOLS');
    expect(params.status).toBe('PAID');
    expect(params.projectId).toBe('proj-1');
    expect(params.sortBy).toBe('amount');
    expect(params.sortOrder).toBe('asc');
    expect(params.dateFrom).toBeDefined();
    expect(params.dateTo).toBeDefined();
    expect(params.activeBoard).toBeUndefined();
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
    expect(params.activeBoard).toBe(true);
  });

  it('does not set activeBoard on backlog variant', () => {
    const params = buildExpenseListApiParams({
      search: '',
      filters: { category: 'all', status: 'all' },
      period: 'month',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pageVariant: 'backlog',
    });
    expect(params.activeBoard).toBeUndefined();
  });

  it('sets closedBoard on closed variant when status filter is unset', () => {
    const params = buildExpenseListApiParams({
      search: '',
      filters: { category: 'all', status: 'all' },
      period: 'month',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pageVariant: 'closed',
    });
    expect(params.status).toBeUndefined();
    expect(params.closedBoard).toBe(true);
    expect(params.activeBoard).toBeUndefined();
  });

  it('sets expensePlanId and omits default activeBoard when plan URL drill-down is set', () => {
    const params = buildExpenseListApiParams({
      search: '',
      filters: { category: 'all', status: 'all' },
      period: 'month',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      pageVariant: 'default',
      expensePlanIdFromUrl: 'plan-99',
    });
    expect(params.expensePlanId).toBe('plan-99');
    expect(params.activeBoard).toBeUndefined();
  });
});

describe('pickExpenseStatsQueryParams', () => {
  it('drops list-only fields (search, category, sort) for stats parity', () => {
    const list = buildExpenseListApiParams({
      search: 'host',
      filters: { category: 'TOOLS', status: 'PAID', project: 'all' },
      period: 'month',
      effectiveProjectId: 'proj-1',
      sortBy: 'amount',
      sortOrder: 'asc',
      pageVariant: 'default',
    });
    const stats = pickExpenseStatsQueryParams(list);
    expect(stats).toEqual({
      dateFrom: list.dateFrom,
      dateTo: list.dateTo,
      projectId: 'proj-1',
      expensePlanId: list.expensePlanId,
      status: 'PAID',
      activeBoard: undefined,
    });
    expect('search' in stats).toBe(false);
    expect('category' in stats).toBe(false);
  });
});
