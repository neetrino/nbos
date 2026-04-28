import { describe, expect, it } from 'vitest';
import {
  EXPENSE_LIST_MAX_PAGE_SIZE,
  normalizeExpenseListPage,
  normalizeExpenseListPageSize,
} from './expenses-list-pagination';

describe('normalizeExpenseListPage', () => {
  it('defaults invalid values to 1', () => {
    expect(normalizeExpenseListPage(undefined)).toBe(1);
    expect(normalizeExpenseListPage(Number.NaN)).toBe(1);
    expect(normalizeExpenseListPage(0)).toBe(1);
    expect(normalizeExpenseListPage(-3)).toBe(1);
  });

  it('floors positive numbers to at least 1', () => {
    expect(normalizeExpenseListPage(2)).toBe(2);
    expect(normalizeExpenseListPage(2.9)).toBe(2);
  });
});

describe('normalizeExpenseListPageSize', () => {
  it('defaults invalid values to 20', () => {
    expect(normalizeExpenseListPageSize(undefined)).toBe(20);
    expect(normalizeExpenseListPageSize(Number.NaN)).toBe(20);
    expect(normalizeExpenseListPageSize(0)).toBe(20);
    expect(normalizeExpenseListPageSize(-1)).toBe(20);
  });

  it('caps at EXPENSE_LIST_MAX_PAGE_SIZE', () => {
    expect(normalizeExpenseListPageSize(EXPENSE_LIST_MAX_PAGE_SIZE)).toBe(
      EXPENSE_LIST_MAX_PAGE_SIZE,
    );
    expect(normalizeExpenseListPageSize(999_999)).toBe(EXPENSE_LIST_MAX_PAGE_SIZE);
  });
});
