'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EXPENSE_BOARD_SCOPE_FILTER_KEY } from '@/features/finance/components/expenses/expense-board-scope';
import type { ExpensesPageVariant } from '@/features/finance/components/expenses/expenses-page-filter-helpers';
import type { ExpensesKanbanScope } from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import { FINANCE_DEFAULT_LIST_PERIOD } from '@/features/finance/constants/finance-period-filter';
import {
  EXPENSE_LIST_DEFAULT_SORT_BY,
  EXPENSE_LIST_DEFAULT_SORT_ORDER,
} from '@/features/finance/constants/expenses-list-query';
import {
  buildExpenseListApiParams,
  EXPENSE_LIST_UI_PAGE_SIZE,
} from '@/features/finance/utils/build-expense-list-api-params';
import { expensesApi, type Expense } from '@/lib/api/finance';
import {
  productFinanceExpenseListPageVariant,
  resolveProductFinanceExpenseScope,
} from '@/features/projects/utils/resolve-product-finance-scope';

export function useProductFinanceExpenses(
  productId: string,
  search: string,
  filters: Record<string, string>,
) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseScope = useMemo(
    () => resolveProductFinanceExpenseScope(filters[EXPENSE_BOARD_SCOPE_FILTER_KEY]),
    [filters],
  );
  const listPageVariant = productFinanceExpenseListPageVariant(expenseScope);
  const pageVariant: ExpensesPageVariant =
    expenseScope === 'closed' ? 'closed' : expenseScope === 'backlog' ? 'backlog' : 'default';
  const kanbanScope: ExpensesKanbanScope = expenseScope === 'closed' ? 'closed' : 'active';
  const fromBacklog = expenseScope === 'backlog';
  const fromAllHistory = expenseScope === 'all';

  const listApiParams = useMemo(
    () =>
      buildExpenseListApiParams({
        search,
        filters,
        period: FINANCE_DEFAULT_LIST_PERIOD,
        effectiveProductId: productId,
        sortBy: EXPENSE_LIST_DEFAULT_SORT_BY,
        sortOrder: EXPENSE_LIST_DEFAULT_SORT_ORDER,
        pageVariant: listPageVariant,
      }),
    [search, filters, productId, listPageVariant],
  );

  const fetchExpenses = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { items } = await expensesApi.getAll({
        ...listApiParams,
        pageSize: EXPENSE_LIST_UI_PAGE_SIZE,
      });
      setExpenses(items);
      setError(null);
    } catch {
      setError('Expenses could not be loaded.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [productId, listApiParams]);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    pageVariant,
    kanbanScope,
    fromBacklog,
    fromAllHistory,
  };
}
