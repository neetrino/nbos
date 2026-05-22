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
import type { Expense } from '@/lib/api/finance';
import { ExpenseKanbanCard } from './ExpenseKanbanCard';
import { createExpenseKanbanQuickCreateConfig } from '@/features/finance/kanban/finance-kanban-quick-create';
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
  /** Backlog route: list-only deferred queue. */
  fromBacklog?: boolean;
  onOpenExpense: (expense: Expense) => void;
  onRequestDelete: (expense: Expense) => void;
  onAddFirstExpense: () => void;
  onKanbanMove?: (expenseId: string, from: string, toStatus: string) => void;
  onOpenQuickCreate?: () => void;
}

export function ExpensesPageMainPanel({
  loading,
  error,
  onRetry,
  expenses,
  view,
  kanbanScope = 'active',
  fromBacklog = false,
  onOpenExpense,
  onRequestDelete,
  onAddFirstExpense,
  onKanbanMove,
  onOpenQuickCreate,
}: ExpensesPageMainPanelProps) {
  const expenseTerminalDropZones = useMemo(
    () => buildTerminalDropZones(EXPENSE_ACTIVE_TERMINAL_DROP_STAGES),
    [],
  );

  const kanbanColumns =
    kanbanScope === 'closed'
      ? buildExpenseClosedKanbanColumns(expenses)
      : buildExpenseKanbanColumns(expenses);

  const expenseQuickCreate = useMemo(
    () =>
      kanbanScope === 'active' && onOpenQuickCreate
        ? createExpenseKanbanQuickCreateConfig(() => onOpenQuickCreate())
        : undefined,
    [kanbanScope, onOpenQuickCreate],
  );

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
        columnQuickCreate={expenseQuickCreate}
        terminalDropZones={
          kanbanScope === 'active' && onKanbanMove ? expenseTerminalDropZones : undefined
        }
        renderColumnHeader={(column) => (
          <KanbanColumnMoneyTotal column={column} getAmount={(expense) => expense.amount} />
        )}
        renderCard={(expense: Expense) => (
          <ExpenseKanbanCard
            expense={expense}
            onOpen={onOpenExpense}
            onRequestDelete={onRequestDelete}
          />
        )}
      />
    );
  }
  return (
    <ExpensesTableSection
      expenses={expenses}
      onOpen={onOpenExpense}
      onRequestDelete={onRequestDelete}
    />
  );
}
