import { describe, expect, it } from 'vitest';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import { productFinanceFilterConfigs } from './product-finance-filter-configs';

describe('productFinanceFilterConfigs', () => {
  it('defaults every section status/scope filter to all', () => {
    expect(productFinanceFilterConfigs('orders').find((row) => row.key === 'boardScope')).toEqual(
      expect.objectContaining({ defaultOptionValue: 'ALL' }),
    );
    expect(productFinanceFilterConfigs('invoices').find((row) => row.key === 'boardScope')).toEqual(
      expect.objectContaining({ defaultOptionValue: 'ALL' }),
    );
    expect(
      productFinanceFilterConfigs('subscriptions').find((row) => row.key === 'status'),
    ).toEqual(
      expect.objectContaining({ defaultOptionValue: 'all', allOptionLabel: 'All statuses' }),
    );
    expect(
      productFinanceFilterConfigs('expenses').find(
        (row) => row.key === EXPENSE_BOARD_SCOPE_FILTER_KEY,
      ),
    ).toEqual(expect.objectContaining({ defaultOptionValue: 'all' }));
    expect(
      productFinanceFilterConfigs('client-services').find((row) => row.key === 'status'),
    ).toEqual(
      expect.objectContaining({ defaultOptionValue: 'all', allOptionLabel: 'All statuses' }),
    );
  });
});
