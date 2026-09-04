import { describe, expect, it } from 'vitest';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryVisual,
} from '@/features/finance/constants/expense-category-visual';
import { EXPENSE_CATEGORIES, EXPENSE_SYSTEM_CATEGORIES } from '@/features/finance/constants/finance';

describe('expense category consolidation', () => {
  it('exposes selectable categories including Partner Payout', () => {
    expect(EXPENSE_CATEGORIES.map((c) => c.value)).toEqual([
      'DOMAIN',
      'TOOLS',
      'MARKETING',
      'OFFICE',
      'TAXES',
      'PARTNER_PAYOUT',
      'OTHER',
    ]);
  });

  it('keeps system payroll categories for labels only', () => {
    expect(EXPENSE_SYSTEM_CATEGORIES.map((c) => c.value)).toEqual(['SALARY', 'BONUS']);
    expect(getExpenseCategoryLabel('SALARY')).toBe('Salary');
    expect(getExpenseCategoryLabel('PARTNER_PAYOUT')).toBe('Partner Payout');
  });

  it('labels and visuals resolve for consolidated buckets', () => {
    expect(getExpenseCategoryLabel('DOMAIN')).toBe('Domain & Hosting');
    expect(getExpenseCategoryLabel('HOSTING')).toBe('Domain & Hosting');
    expect(getExpenseCategoryLabel('TOOLS')).toBe('Tools & services');
    expect(getExpenseCategoryLabel('SERVICE')).toBe('Tools & services');
    expect(getExpenseCategoryLabel('TAXES')).toBe('Taxes & fees');
    expect(getExpenseCategoryLabel('BANK_FEES')).toBe('Taxes & fees');
    expect(getExpenseCategoryLabel('TRAINING')).toBe('Other');
    expect(getExpenseCategoryVisual('INTERNAL_INFRA').icon).toBeTruthy();
  });
});
