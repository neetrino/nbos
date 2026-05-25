import { describe, expect, it } from 'vitest';
import {
  pickExpenseBacklogReasonFilter,
  pickExpenseCategoryFilter,
  pickExpenseFrequencyFilter,
  pickExpenseStatusFilter,
  pickExpenseTypeFilter,
  pickTaxStatusFilter,
} from './expense-query-enum-guards';

describe('expense-query-enum-guards', () => {
  it('accepts known enum members', () => {
    expect(pickExpenseTypeFilter('PLANNED')).toBe('PLANNED');
    expect(pickExpenseCategoryFilter('HOSTING')).toBe('HOSTING');
    expect(pickExpenseFrequencyFilter('MONTHLY')).toBe('MONTHLY');
    expect(pickExpenseStatusFilter('BACKLOG')).toBe('BACKLOG');
    expect(pickExpenseStatusFilter('PLANNED')).toBe('PLANNED');
  });

  it('returns undefined for unknown or empty values', () => {
    expect(pickExpenseTypeFilter('NOT_VALID')).toBeUndefined();
    expect(pickExpenseStatusFilter('OLD')).toBeUndefined();
    expect(pickExpenseCategoryFilter('')).toBeUndefined();
    expect(pickExpenseFrequencyFilter(undefined)).toBeUndefined();
    expect(pickTaxStatusFilter(null)).toBeUndefined();
  });

  it('accepts tax status members', () => {
    expect(pickTaxStatusFilter('TAX')).toBe('TAX');
    expect(pickTaxStatusFilter('TAX_FREE')).toBe('TAX_FREE');
  });

  it('accepts backlog reason members', () => {
    expect(pickExpenseBacklogReasonFilter('DEBT_PAY_LATER')).toBe('DEBT_PAY_LATER');
    expect(pickExpenseBacklogReasonFilter('OTHER')).toBe('OTHER');
    expect(pickExpenseBacklogReasonFilter('NOT_A_REASON')).toBeUndefined();
  });
});
