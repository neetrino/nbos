'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExpensesPageMainPanel,
  type ExpensesViewMode,
} from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import { useExpenseKanbanStatusChange } from '@/features/finance/components/expenses/use-expense-kanban-status-change';
import {
  expenseDetailHref,
  projectExpensesBacklogDrilldownHref,
  projectExpensesDrilldownHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import {
  EXPENSE_LIST_DEFAULT_SORT_BY,
  EXPENSE_LIST_DEFAULT_SORT_ORDER,
} from '@/features/finance/constants/expenses-list-query';
import { useProductFinanceExpenses } from '@/features/projects/hooks/use-product-finance-expenses';
import type { Expense } from '@/lib/api/finance';

interface ProductFinanceExpensesPanelProps {
  projectId: string;
  search: string;
  filters: Record<string, string>;
  view: ExpensesViewMode;
}

export function ProductFinanceExpensesPanel({
  projectId,
  search,
  filters,
  view,
}: ProductFinanceExpensesPanelProps) {
  const router = useRouter();
  const { expenses, loading, error, refetch, pageVariant, kanbanScope, fromBacklog } =
    useProductFinanceExpenses(projectId, true, search, filters);

  const listSort = {
    sortBy: EXPENSE_LIST_DEFAULT_SORT_BY,
    sortOrder: EXPENSE_LIST_DEFAULT_SORT_ORDER,
  } as const;

  const listOptions = {
    fromBacklog,
    closed: pageVariant === 'closed',
  } as const;

  const handleKanbanMove = useExpenseKanbanStatusChange({
    listProjectId: projectId,
    listSort,
    fromBacklog,
    closed: pageVariant === 'closed',
    expensePlanId: null,
  });

  const handleOpenExpense = useCallback(
    (expense: Expense) => {
      router.push(expenseDetailHref(expense.id, projectId, listSort, listOptions));
    },
    [router, projectId, listOptions],
  );

  const handleAddFirstExpense = useCallback(() => {
    router.push(
      fromBacklog
        ? projectExpensesBacklogDrilldownHref(projectId)
        : projectExpensesDrilldownHref(projectId),
    );
  }, [router, projectId, fromBacklog]);

  const onKanbanMove = useCallback(
    async (expenseId: string, from: string, toStatus: string) => {
      await handleKanbanMove(expenseId, toStatus, expenses, refetch);
    },
    [handleKanbanMove, expenses, refetch],
  );

  return (
    <ExpensesPageMainPanel
      loading={loading}
      error={error}
      onRetry={() => void refetch()}
      expenses={expenses}
      view={fromBacklog ? 'list' : view}
      kanbanScope={kanbanScope}
      fromBacklog={fromBacklog}
      onOpenExpense={handleOpenExpense}
      onRequestDelete={handleOpenExpense}
      onAddFirstExpense={handleAddFirstExpense}
      onKanbanMove={pageVariant === 'backlog' ? undefined : onKanbanMove}
    />
  );
}
