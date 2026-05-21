'use client';

import { useMemo } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  KanbanBoard,
  KanbanColumnMoneyTotal,
  LoadingState,
} from '@/components/shared';
import { buildTerminalDropZones } from '@/features/shared/kanban-terminal-drop';
import { EXPENSE_ACTIVE_TERMINAL_DROP_STAGES } from '@/features/finance/constants/expense-board';
import type { ExpenseListNavigationSort } from '@/features/finance/constants/project-expenses-drilldown';
import type { Expense } from '@/lib/api/finance';
import { ExpenseKanbanCard } from './ExpenseKanbanCard';
import {
  buildExpenseClosedKanbanColumns,
  buildExpenseKanbanColumns,
} from './expense-kanban-columns';
import { ExpensesTableSection } from './ExpensesTableSection';

export type ExpensesViewMode = 'kanban' | 'list';

export type ExpensesKanbanScope = 'active' | 'closed';

interface ExpensesPageMainPanelProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  expenses: Expense[];
  view: ExpensesViewMode;
  kanbanScope?: ExpensesKanbanScope;
  /** Detail links include `from=backlog` when opened from `/finance/expenses/backlog`. */
  fromBacklog?: boolean;
  effectiveProjectId: string | null;
  /** When set, detail links preserve `?expensePlanId=` from the list URL. */
  listExpensePlanId?: string | null;
  listSort: ExpenseListNavigationSort;
  onRequestDelete: (expense: Expense) => void;
  onAddFirstExpense: () => void;
  onKanbanMove?: (expenseId: string, from: string, toStatus: string) => void;
}

export function ExpensesPageMainPanel({
  loading,
  error,
  onRetry,
  expenses,
  view,
  kanbanScope = 'active',
  fromBacklog = false,
  effectiveProjectId,
  listExpensePlanId = null,
  listSort,
  onRequestDelete,
  onAddFirstExpense,
  onKanbanMove,
}: ExpensesPageMainPanelProps) {
  const expenseTerminalDropZones = useMemo(
    () => buildTerminalDropZones(EXPENSE_ACTIVE_TERMINAL_DROP_STAGES),
    [],
  );

  const kanbanColumns =
    kanbanScope === 'closed'
      ? buildExpenseClosedKanbanColumns(expenses)
      : buildExpenseKanbanColumns(expenses);

  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title={fromBacklog ? 'No deferred expenses' : 'No expenses yet'}
        description={
          fromBacklog
            ? 'Nothing matches this backlog scope for the selected period.'
            : 'Track company expenses here'
        }
        action={
          <Button type="button" onClick={onAddFirstExpense}>
            <Plus size={16} />
            Add First Expense
          </Button>
        }
      />
    );
  }
  if (view === 'kanban') {
    return (
      <KanbanBoard
        columns={kanbanColumns}
        columnWidth={kanbanScope === 'closed' ? 288 : undefined}
        getItemId={(e: Expense) => e.id}
        onMove={onKanbanMove}
        terminalDropZones={
          kanbanScope === 'active' && onKanbanMove ? expenseTerminalDropZones : undefined
        }
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal column={column} getAmount={(expense) => expense.amount} />
        )}
        renderCard={(expense: Expense) => (
          <ExpenseKanbanCard
            expense={expense}
            listProjectId={effectiveProjectId}
            listExpensePlanId={listExpensePlanId}
            listSort={listSort}
            fromBacklog={fromBacklog}
            onRequestDelete={onRequestDelete}
          />
        )}
      />
    );
  }
  return (
    <ExpensesTableSection
      expenses={expenses}
      listProjectId={effectiveProjectId}
      listExpensePlanId={listExpensePlanId}
      listSort={listSort}
      fromBacklog={fromBacklog}
      onRequestDelete={onRequestDelete}
    />
  );
}
