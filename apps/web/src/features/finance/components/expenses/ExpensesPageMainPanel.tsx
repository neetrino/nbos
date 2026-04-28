'use client';

import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, KanbanBoard, LoadingState } from '@/components/shared';
import type { ExpenseListNavigationSort } from '@/features/finance/constants/project-expenses-drilldown';
import type { Expense } from '@/lib/api/finance';
import { ExpenseKanbanCard } from './ExpenseKanbanCard';
import { buildExpenseKanbanColumns } from './expense-kanban-columns';
import { ExpensesTableSection } from './ExpensesTableSection';

export type ExpensesViewMode = 'kanban' | 'list';

interface ExpensesPageMainPanelProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  expenses: Expense[];
  view: ExpensesViewMode;
  /** Detail links include `from=backlog` when opened from `/finance/expenses/backlog`. */
  fromBacklog?: boolean;
  effectiveProjectId: string | null;
  listSort: ExpenseListNavigationSort;
  onRequestDelete: (expense: Expense) => void;
  onAddFirstExpense: () => void;
}

export function ExpensesPageMainPanel({
  loading,
  error,
  onRetry,
  expenses,
  view,
  fromBacklog = false,
  effectiveProjectId,
  listSort,
  onRequestDelete,
  onAddFirstExpense,
}: ExpensesPageMainPanelProps) {
  const kanbanColumns = buildExpenseKanbanColumns(expenses);

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
        getItemId={(e: Expense) => e.id}
        renderCard={(expense: Expense) => (
          <ExpenseKanbanCard
            expense={expense}
            listProjectId={effectiveProjectId}
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
      listSort={listSort}
      fromBacklog={fromBacklog}
      onRequestDelete={onRequestDelete}
    />
  );
}
