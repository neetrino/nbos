import { describe, expect, it } from 'vitest';
import {
  buildExpensePlanListApiParams,
  buildExpensePlanListExportParams,
  expensePlanListHasActiveFilters,
  parseExpensePlansListCategoryParam,
  parseExpensePlansListProjectIdParam,
  parseExpensePlansListSearchParam,
} from '@/features/finance/utils/build-expense-plan-list-api-params';

describe('parseExpensePlansListCategoryParam', () => {
  it('returns undefined for empty or unknown', () => {
    expect(parseExpensePlansListCategoryParam(null)).toBeUndefined();
    expect(parseExpensePlansListCategoryParam('')).toBeUndefined();
    expect(parseExpensePlansListCategoryParam('OFFICE')).toBeUndefined();
    expect(parseExpensePlansListCategoryParam('NOT_REAL')).toBeUndefined();
  });

  it('accepts allowed plan categories', () => {
    expect(parseExpensePlansListCategoryParam('HOSTING')).toBe('HOSTING');
  });
});

describe('parseExpensePlansListProjectIdParam', () => {
  it('trims and drops empty', () => {
    expect(parseExpensePlansListProjectIdParam('  ')).toBeUndefined();
    expect(parseExpensePlansListProjectIdParam('abc')).toBe('abc');
  });
});

describe('parseExpensePlansListSearchParam', () => {
  it('trims', () => {
    expect(parseExpensePlansListSearchParam('  rent  ')).toBe('rent');
  });
});

describe('buildExpensePlanListApiParams', () => {
  it('includes paging and stable sort', () => {
    expect(
      buildExpensePlanListApiParams({
        search: '',
        page: 1,
        pageSize: 100,
      }),
    ).toEqual({ sortBy: 'name', sortOrder: 'asc', page: 1, pageSize: 100 });
  });

  it('passes filters when set', () => {
    expect(
      buildExpensePlanListApiParams({
        search: 'acme',
        category: 'TOOLS',
        projectId: 'p1',
        page: 1,
        pageSize: 50,
      }),
    ).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
      search: 'acme',
      category: 'TOOLS',
      projectId: 'p1',
      page: 1,
      pageSize: 50,
    });
  });
});

describe('buildExpensePlanListExportParams', () => {
  it('omits page and pageSize', () => {
    expect(buildExpensePlanListExportParams({ search: 'x' })).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
      search: 'x',
    });
  });
});

describe('expensePlanListHasActiveFilters', () => {
  it('detects any filter', () => {
    expect(expensePlanListHasActiveFilters({ search: '' })).toBe(false);
    expect(expensePlanListHasActiveFilters({ search: 'a' })).toBe(true);
    expect(expensePlanListHasActiveFilters({ search: '', category: 'OTHER' })).toBe(true);
    expect(expensePlanListHasActiveFilters({ search: '', projectId: 'z' })).toBe(true);
  });
});
