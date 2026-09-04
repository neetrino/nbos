import { describe, expect, it } from 'vitest';
import {
  buildExpensePlanListApiParams,
  buildExpensePlanListExportParams,
  expensePlanListHasActiveFilters,
  parseExpensePlansListCategoryParam,
  parseExpensePlansListProjectIdParam,
  parseExpensePlansListSearchParam,
  parseExpensePlansListStatusParam,
} from '@/features/finance/utils/build-expense-plan-list-api-params';

describe('parseExpensePlansListCategoryParam', () => {
  it('returns undefined for empty or unknown', () => {
    expect(parseExpensePlansListCategoryParam(null)).toBeUndefined();
    expect(parseExpensePlansListCategoryParam('')).toBeUndefined();
    expect(parseExpensePlansListCategoryParam('NOT_REAL')).toBeUndefined();
  });

  it('accepts canonical plan categories and coerces legacy', () => {
    expect(parseExpensePlansListCategoryParam('DOMAIN')).toBe('DOMAIN');
    expect(parseExpensePlansListCategoryParam('HOSTING')).toBe('DOMAIN');
    expect(parseExpensePlansListCategoryParam('OFFICE')).toBe('OFFICE');
    expect(parseExpensePlansListCategoryParam('INTERNAL_INFRA')).toBe('TOOLS');
    expect(parseExpensePlansListCategoryParam('TAXES')).toBe('TAXES');
    expect(parseExpensePlansListCategoryParam('BANK_FEES')).toBe('TAXES');
    expect(parseExpensePlansListCategoryParam('TRAINING')).toBe('OTHER');
    expect(parseExpensePlansListCategoryParam('TOOLS')).toBe('TOOLS');
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

describe('parseExpensePlansListStatusParam', () => {
  it('defaults to Active and accepts cancelled or all', () => {
    expect(parseExpensePlansListStatusParam(null)).toBe('ACTIVE');
    expect(parseExpensePlansListStatusParam('CANCELLED')).toBe('CANCELLED');
    expect(parseExpensePlansListStatusParam('all')).toBe('all');
    expect(parseExpensePlansListStatusParam('NOPE')).toBe('ACTIVE');
  });
});

describe('buildExpensePlanListApiParams', () => {
  it('includes paging, stable sort, and default Active status', () => {
    expect(
      buildExpensePlanListApiParams({
        search: '',
        page: 1,
        pageSize: 100,
      }),
    ).toEqual({ sortBy: 'name', sortOrder: 'asc', status: 'ACTIVE', page: 1, pageSize: 100 });
  });

  it('passes filters when set', () => {
    expect(
      buildExpensePlanListApiParams({
        search: 'acme',
        category: 'TOOLS',
        projectId: 'p1',
        status: 'CANCELLED',
        page: 1,
        pageSize: 50,
      }),
    ).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
      search: 'acme',
      category: 'TOOLS',
      projectId: 'p1',
      status: 'CANCELLED',
      page: 1,
      pageSize: 50,
    });
  });

  it('omits status when All is selected', () => {
    expect(
      buildExpensePlanListApiParams({
        search: '',
        status: 'all',
        page: 1,
        pageSize: 100,
      }),
    ).toEqual({ sortBy: 'name', sortOrder: 'asc', page: 1, pageSize: 100 });
  });
});

describe('buildExpensePlanListExportParams', () => {
  it('omits page and pageSize', () => {
    expect(buildExpensePlanListExportParams({ search: 'x' })).toEqual({
      sortBy: 'name',
      sortOrder: 'asc',
      search: 'x',
      status: 'ACTIVE',
    });
  });
});

describe('expensePlanListHasActiveFilters', () => {
  it('detects any filter', () => {
    expect(expensePlanListHasActiveFilters({ search: '' })).toBe(false);
    expect(expensePlanListHasActiveFilters({ search: 'a' })).toBe(true);
    expect(expensePlanListHasActiveFilters({ search: '', category: 'OTHER' })).toBe(true);
    expect(expensePlanListHasActiveFilters({ search: '', projectId: 'z' })).toBe(true);
    expect(expensePlanListHasActiveFilters({ search: '', status: 'ACTIVE' })).toBe(false);
    expect(expensePlanListHasActiveFilters({ search: '', status: 'CANCELLED' })).toBe(true);
    expect(expensePlanListHasActiveFilters({ search: '', status: 'all' })).toBe(true);
  });
});
