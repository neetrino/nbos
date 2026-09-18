'use client';

import { useMemo } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DataView,
  EmptyState,
  KanbanBoard,
  KanbanColumnMoneyTotal,
  ListMutationErrorBanner,
  LoadingState,
  QueryLoadError,
} from '@/components/shared';
import { buildTerminalDropZones } from '@/features/shared/kanban-terminal-drop';
import { EXPENSE_ACTIVE_TERMINAL_DROP_STAGES } from '@/features/finance/constants/expense-board';
import type { Expense } from '@/lib/api/finance';
import { ExpenseKanbanCard } from './ExpenseKanbanCard';
import { createExpenseKanbanQuickCreateConfig } from '@/features/finance/kanban/finance-kanban-quick-create';
import {
  buildExpenseClosedKanbanColumns,
  buildExpenseKanbanColumns,
  buildExpenseLifecycleKanbanColumns,
} from './expense-kanban-columns';
import type { ExpensesKanbanScope } from './expense-lifecycle-scope';
import { ExpensesTableSection } from './ExpensesTableSection';
import { translateExpenseStage } from './expense-i18n-labels';

export type ExpensesViewMode = 'kanban' | 'list';

export type { ExpensesKanbanScope } from './expense-lifecycle-scope';

interface ExpensesPageMainPanelProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDismissError: () => void;
  expenses: Expense[];
  view: ExpensesViewMode;
  kanbanScope?: ExpensesKanbanScope;
  /** Backlog route: list-only deferred queue. */
  fromBacklog?: boolean;
  onOpenExpense: (expense: Expense) => void;
  onAddFirstExpense?: () => void;
  onKanbanMove?: (expenseId: string, from: string, toStatus: string) => void;
  onOpenQuickCreate?: () => void;
}

export function ExpensesPageMainPanel({
  loading,
  error,
  onRetry,
  onDismissError,
  expenses,
  view,
  kanbanScope = 'active',
  fromBacklog = false,
  onOpenExpense,
  onAddFirstExpense,
  onKanbanMove,
  onOpenQuickCreate,
}: ExpensesPageMainPanelProps) {
  const t = useTranslations('expenses');
  const expenseTerminalDropZones = useMemo(
    () =>
      buildTerminalDropZones(EXPENSE_ACTIVE_TERMINAL_DROP_STAGES).map((zone) => ({
        ...zone,
        label: translateExpenseStage(zone.key, t),
      })),
    [t],
  );

  const kanbanColumns = useMemo(() => {
    const columns =
      kanbanScope === 'closed'
        ? buildExpenseClosedKanbanColumns(expenses)
        : kanbanScope === 'all'
          ? buildExpenseLifecycleKanbanColumns(expenses)
          : buildExpenseKanbanColumns(expenses);
    return columns.map((column) => ({
      ...column,
      label: translateExpenseStage(column.key, t),
    }));
  }, [expenses, kanbanScope, t]);

  const expenseQuickCreate = useMemo(
    () =>
      (kanbanScope === 'active' || kanbanScope === 'all') && onOpenQuickCreate
        ? createExpenseKanbanQuickCreateConfig(() => onOpenQuickCreate(), t('actions.quickExpense'))
        : undefined,
    [kanbanScope, onOpenQuickCreate, t],
  );

  return (
    <DataView
      loading={loading}
      error={error}
      hasData={expenses.length > 0}
      loadingFallback={<LoadingState />}
      errorFallback={<QueryLoadError description={error ?? ''} onRetry={onRetry} />}
      emptyFallback={
        <EmptyState
          icon={Receipt}
          title={fromBacklog ? t('empty.backlogTitle') : t('empty.title')}
          description={fromBacklog ? t('empty.backlogDescription') : t('empty.description')}
          action={
            onAddFirstExpense ? (
              <Button type="button" onClick={onAddFirstExpense}>
                <Plus size={16} />
                {t('actions.addFirst')}
              </Button>
            ) : undefined
          }
        />
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {error ? <ListMutationErrorBanner message={error} onDismiss={onDismissError} /> : null}
        {view === 'kanban' ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <KanbanBoard
              columns={kanbanColumns}
              columnWidth={kanbanScope === 'closed' ? 288 : undefined}
              getItemId={(e: Expense) => e.id}
              onMove={onKanbanMove}
              columnQuickCreate={expenseQuickCreate}
              terminalDropZones={
                (kanbanScope === 'active' || kanbanScope === 'all') && onKanbanMove
                  ? expenseTerminalDropZones
                  : undefined
              }
              renderColumnHeader={(column) => (
                <KanbanColumnMoneyTotal column={column} getAmount={(expense) => expense.amount} />
              )}
              renderCard={(expense: Expense) => (
                <ExpenseKanbanCard expense={expense} onOpen={onOpenExpense} />
              )}
            />
          </div>
        ) : (
          <ExpensesTableSection expenses={expenses} onOpen={onOpenExpense} />
        )}
      </div>
    </DataView>
  );
}
