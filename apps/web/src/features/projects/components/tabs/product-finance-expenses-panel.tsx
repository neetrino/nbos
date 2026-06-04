'use client';

import { useCallback } from 'react';
import {
  ExpensesPageMainPanel,
  type ExpensesViewMode,
} from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import { ExpenseDetailSheet } from '@/features/finance/components/expenses/ExpenseDetailSheet';
import { useExpenseKanbanStatusChange } from '@/features/finance/components/expenses/use-expense-kanban-status-change';
import {
  projectExpensesBacklogDrilldownHref,
  projectExpensesDrilldownHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import {
  EXPENSE_LIST_DEFAULT_SORT_BY,
  EXPENSE_LIST_DEFAULT_SORT_ORDER,
} from '@/features/finance/constants/expenses-list-query';
import { useProductFinanceExpenses } from '@/features/projects/hooks/use-product-finance-expenses';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import type { Expense } from '@/lib/api/finance';
import { useRouter } from 'next/navigation';

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
  const expenseSheet = useProductEntityDetailSheet();
  const { expenses, loading, error, refetch, pageVariant, kanbanScope, fromBacklog } =
    useProductFinanceExpenses(projectId, search, filters);

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
      expenseSheet.openEntity(expense.id);
    },
    [expenseSheet],
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
    <>
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

      <ExpenseDetailSheet
        expenseId={expenseSheet.entityId}
        open={expenseSheet.isOpen}
        onOpenChange={expenseSheet.handleOpenChange}
        listProjectId={projectId}
        listSort={listSort}
        listHrefOptions={listOptions}
        onExpenseUpdated={() => void refetch()}
        onExpenseDeleted={() => {
          expenseSheet.handleOpenChange(false);
          void refetch();
        }}
      />
    </>
  );
}
