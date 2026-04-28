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
        title="No expenses yet"
        description="Track company expenses here"
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
      onRequestDelete={onRequestDelete}
    />
  );
}
