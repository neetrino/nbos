import { describe, expect, it } from 'vitest';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryVisual,
} from '@/features/finance/constants/expense-category-visual';
import { EXPENSE_CATEGORIES, EXPENSE_SYSTEM_CATEGORIES } from '@/features/finance/constants/finance';

describe('expense category ops cuts', () => {
  it('includes additive P&L categories in the shared UI list', () => {
    const values = EXPENSE_CATEGORIES.map((c) => c.value);
    expect(values).toEqual(
      expect.arrayContaining([
        'OFFICE',
        'TAXES',
        'BANK_FEES',
        'TRAINING',
        'INTERNAL_INFRA',
        'DOMAIN',
        'HOSTING',
      ]),
    );
    expect(values).not.toContain('SALARY');
    expect(values).not.toContain('BONUS');
    expect(values).not.toContain('PARTNER_PAYOUT');
  });

  it('keeps system payroll categories for labels only', () => {
    expect(EXPENSE_SYSTEM_CATEGORIES.map((c) => c.value)).toEqual([
      'SALARY',
      'BONUS',
      'PARTNER_PAYOUT',
    ]);
    expect(getExpenseCategoryLabel('SALARY')).toBe('Salary');
  });

  it('labels and visuals resolve for new categories', () => {
    expect(getExpenseCategoryLabel('OFFICE')).toBe('Office');
    expect(getExpenseCategoryLabel('TAXES')).toBe('Taxes');
    expect(getExpenseCategoryLabel('BANK_FEES')).toBe('Bank fees');
    expect(getExpenseCategoryLabel('TRAINING')).toBe('Training');
    expect(getExpenseCategoryLabel('INTERNAL_INFRA')).toBe('Internal infra');
    expect(getExpenseCategoryVisual('INTERNAL_INFRA').icon).toBeTruthy();
  });
});
