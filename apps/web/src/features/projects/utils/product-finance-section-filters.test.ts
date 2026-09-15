import { describe, expect, it } from 'vitest';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import {
  defaultProductFinanceFiltersForSection,
  nextProductFinanceSectionFilters,
} from './product-finance-section-filters';

describe('defaultProductFinanceFiltersForSection', () => {
  it('starts every section with empty filters so UI defaults to all', () => {
    expect(defaultProductFinanceFiltersForSection('orders')).toEqual({});
    expect(defaultProductFinanceFiltersForSection('invoices')).toEqual({});
    expect(defaultProductFinanceFiltersForSection('subscriptions')).toEqual({});
    expect(defaultProductFinanceFiltersForSection('expenses')).toEqual({});
    expect(defaultProductFinanceFiltersForSection('client-services')).toEqual({});
  });
});

describe('nextProductFinanceSectionFilters', () => {
  it('omits the product-finance default board and expense scopes', () => {
    expect(nextProductFinanceSectionFilters({ boardScope: 'ACTIVE' }, 'boardScope', 'ALL')).toEqual(
      {},
    );
    expect(
      nextProductFinanceSectionFilters(
        { [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'active' },
        EXPENSE_BOARD_SCOPE_FILTER_KEY,
        'all',
      ),
    ).toEqual({});
  });

  it('stores an explicit narrowing scope', () => {
    expect(nextProductFinanceSectionFilters({}, 'boardScope', 'ACTIVE')).toEqual({
      boardScope: 'ACTIVE',
    });
    expect(nextProductFinanceSectionFilters({}, EXPENSE_BOARD_SCOPE_FILTER_KEY, 'active')).toEqual({
      [EXPENSE_BOARD_SCOPE_FILTER_KEY]: 'active',
    });
  });
});
