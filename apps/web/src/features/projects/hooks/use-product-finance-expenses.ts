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

function resolveExpensePageVariant(filters: Record<string, string>): ExpensesPageVariant {
  const scope = filters[EXPENSE_BOARD_SCOPE_FILTER_KEY] ?? 'active';
  if (scope === 'backlog') return 'backlog';
  if (scope === 'closed') return 'closed';
  return 'default';
}

export function useProductFinanceExpenses(
  projectId: string,
  enabled: boolean,
  search: string,
  filters: Record<string, string>,
) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageVariant = useMemo(() => resolveExpensePageVariant(filters), [filters]);
  const kanbanScope: ExpensesKanbanScope = pageVariant === 'closed' ? 'closed' : 'active';
  const fromBacklog = pageVariant === 'backlog';

  const listApiParams = useMemo(
    () =>
      buildExpenseListApiParams({
        search,
        filters,
        period: FINANCE_DEFAULT_LIST_PERIOD,
        effectiveProjectId: projectId,
        sortBy: EXPENSE_LIST_DEFAULT_SORT_BY,
        sortOrder: EXPENSE_LIST_DEFAULT_SORT_ORDER,
        pageVariant,
      }),
    [search, filters, projectId, pageVariant],
  );

  const fetchExpenses = useCallback(async () => {
    if (!projectId) return;
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
  }, [projectId, listApiParams]);

  useEffect(() => {
    if (enabled) {
      void fetchExpenses();
    }
  }, [enabled, fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    pageVariant,
    kanbanScope,
    fromBacklog,
  };
}
