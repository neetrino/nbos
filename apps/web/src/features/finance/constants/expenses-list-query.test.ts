import { describe, it, expect } from 'vitest';
import {
  parseExpenseListSortByParam,
  parseExpenseListSortOrderParam,
  setExpenseListSortParams,
  EXPENSE_LIST_SORT_BY_QUERY,
  EXPENSE_LIST_SORT_ORDER_QUERY,
} from './expenses-list-query';

describe('parseExpenseListSortByParam', () => {
  it('returns default when null or unknown', () => {
    expect(parseExpenseListSortByParam(null)).toBe('createdAt');
    expect(parseExpenseListSortByParam('')).toBe('createdAt');
    expect(parseExpenseListSortByParam('hack')).toBe('createdAt');
  });

  it('returns allowed fields', () => {
    expect(parseExpenseListSortByParam('amount')).toBe('amount');
    expect(parseExpenseListSortByParam('status')).toBe('status');
  });
});

describe('parseExpenseListSortOrderParam', () => {
  it('returns asc only when explicitly asc', () => {
    expect(parseExpenseListSortOrderParam(null)).toBe('desc');
    expect(parseExpenseListSortOrderParam('')).toBe('desc');
    expect(parseExpenseListSortOrderParam('desc')).toBe('desc');
    expect(parseExpenseListSortOrderParam('asc')).toBe('asc');
  });
});

describe('setExpenseListSortParams', () => {
  it('removes sort keys for default sort', () => {
    const p = new URLSearchParams('sortBy=amount&sortOrder=asc');
    setExpenseListSortParams(p, 'createdAt', 'desc');
    expect(p.get(EXPENSE_LIST_SORT_BY_QUERY)).toBeNull();
    expect(p.get(EXPENSE_LIST_SORT_ORDER_QUERY)).toBeNull();
  });

  it('sets keys for non-default sort', () => {
    const p = new URLSearchParams();
    setExpenseListSortParams(p, 'amount', 'asc');
    expect(p.get(EXPENSE_LIST_SORT_BY_QUERY)).toBe('amount');
    expect(p.get(EXPENSE_LIST_SORT_ORDER_QUERY)).toBe('asc');
  });
});
