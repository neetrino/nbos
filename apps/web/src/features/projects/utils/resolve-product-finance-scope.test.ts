import { describe, expect, it } from 'vitest';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import {
  PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE,
  PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
  productFinanceExpenseAllowsKanban,
  productFinanceExpenseListPageVariant,
  resolveProductFinanceBoardScope,
  resolveProductFinanceExpenseScope,
} from './resolve-product-finance-scope';

describe('resolveProductFinanceBoardScope', () => {
  it('defaults unset scope to all statuses', () => {
    expect(resolveProductFinanceBoardScope(undefined)).toBe(PRODUCT_FINANCE_DEFAULT_BOARD_SCOPE);
    expect(resolveProductFinanceBoardScope('ALL')).toBe('ALL');
  });

  it('keeps explicit pipeline scopes', () => {
    expect(resolveProductFinanceBoardScope('ACTIVE')).toBe('ACTIVE');
    expect(resolveProductFinanceBoardScope('CLOSED')).toBe('CLOSED');
  });
});

describe('resolveProductFinanceExpenseScope', () => {
  it('defaults unset scope to all statuses', () => {
    expect(resolveProductFinanceExpenseScope(undefined)).toBe(
      PRODUCT_FINANCE_DEFAULT_EXPENSE_SCOPE,
    );
  });

  it('maps list page variants', () => {
    expect(productFinanceExpenseListPageVariant('all')).toBe('all');
    expect(productFinanceExpenseListPageVariant('active')).toBe('default');
    expect(productFinanceExpenseListPageVariant('backlog')).toBe('backlog');
    expect(productFinanceExpenseListPageVariant('closed')).toBe('closed');
  });

  it('allows kanban only for pay-now and closed boards', () => {
    expect(productFinanceExpenseAllowsKanban({})).toBe(false);
    expect(productFinanceExpenseAllowsKanban({ [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'all' })).toBe(
      false,
    );
    expect(productFinanceExpenseAllowsKanban({ [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'active' })).toBe(
      true,
    );
    expect(productFinanceExpenseAllowsKanban({ [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'closed' })).toBe(
      true,
    );
  });
});
