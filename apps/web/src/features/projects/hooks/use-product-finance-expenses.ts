'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { expensesApi, type Expense } from '@/lib/api/finance';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
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
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState(false);
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
    beginLoad(expensesRef.current.length > 0);
    try {
      const { items } = await expensesApi.getAll({
        ...listApiParams,
        pageSize: EXPENSE_LIST_UI_PAGE_SIZE,
      });
      setExpenses(items);
      setError(null);
    } catch (caught) {
      // A failed refresh keeps the cards already on screen, unless the server withdrew read
      // access: those cards must not survive a denial.
      if (isAccessRevokedApiError(caught)) setExpenses([]);
      setError(getApiErrorMessage(caught, 'Expenses could not be loaded.'));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, productId, listApiParams]);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    setExpenses,
    loading,
    error,
    clearError: () => setError(null),
    refetch: fetchExpenses,
    pageVariant,
    kanbanScope,
    fromBacklog,
    fromAllHistory,
  };
}
