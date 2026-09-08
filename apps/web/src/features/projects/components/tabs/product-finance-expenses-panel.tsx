'use client';

import { useCallback, useState } from 'react';
import {
  ExpensesPageMainPanel,
  type ExpensesViewMode,
} from '@/features/finance/components/expenses/ExpensesPageMainPanel';
import { CreateExpenseDialog } from '@/features/finance/components/expenses/CreateExpenseDialog';
import { ExpenseDetailSheet } from '@/features/finance/components/expenses/ExpenseDetailSheet';
import { useExpenseKanbanStatusChange } from '@/features/finance/components/expenses/use-expense-kanban-status-change';
import {
  EXPENSE_LIST_DEFAULT_SORT_BY,
  EXPENSE_LIST_DEFAULT_SORT_ORDER,
} from '@/features/finance/constants/expenses-list-query';
import { useProductFinanceExpenses } from '@/features/projects/hooks/use-product-finance-expenses';
import { useProductEntityDetailSheet } from '@/features/projects/hooks/use-product-entity-detail-sheet';
import type { Expense } from '@/lib/api/finance';

interface ProductFinanceExpensesPanelProps {
  projectId: string;
  productId: string;
  search: string;
  filters: Record<string, string>;
  view: ExpensesViewMode;
}

export function ProductFinanceExpensesPanel({
  projectId,
  productId,
  search,
  filters,
  view,
}: ProductFinanceExpensesPanelProps) {
  const expenseSheet = useProductEntityDetailSheet<Expense>();
  const [createOpen, setCreateOpen] = useState(false);
  const { expenses, loading, error, refetch, pageVariant, kanbanScope, fromBacklog } =
    useProductFinanceExpenses(productId, search, filters);

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
      expenseSheet.openEntity(expense);
    },
    [expenseSheet],
  );

  const handleAddFirstExpense = useCallback(() => {
    setCreateOpen(true);
  }, []);

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
        onAddFirstExpense={handleAddFirstExpense}
        onKanbanMove={pageVariant === 'backlog' ? undefined : onKanbanMove}
      />

      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProductId={productId}
        defaultStatus={fromBacklog ? 'BACKLOG' : undefined}
        onCreated={() => {
          void refetch();
        }}
      />

      <ExpenseDetailSheet
        expenseId={expenseSheet.entityId}
        initialExpense={expenseSheet.seedEntity}
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
