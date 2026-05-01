'use client';

import type { Expense } from '@/lib/api/finance';
import { CreateExpenseDialog } from './CreateExpenseDialog';
import { DeleteExpenseDialog } from './DeleteExpenseDialog';

interface ExpensesPageDialogsProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  effectiveProjectId: string | null;
  /** When set, new expense form defaults to this status (backlog → Delayed). */
  defaultCreateStatus?: string;
  onExpenseCreated: (created: Expense) => void;
  deleteTarget: Expense | null;
  deleteSubmitting: boolean;
  deleteError: string | null;
  onDeleteOpenChange: (open: boolean) => void;
  onConfirmDeleteExpense: () => void;
}

export function ExpensesPageDialogs({
  createOpen,
  onCreateOpenChange,
  effectiveProjectId,
  defaultCreateStatus,
  onExpenseCreated,
  deleteTarget,
  deleteSubmitting,
  deleteError,
  onDeleteOpenChange,
  onConfirmDeleteExpense,
}: ExpensesPageDialogsProps) {
  return (
    <>
      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        defaultProjectId={effectiveProjectId}
        defaultStatus={defaultCreateStatus}
        onCreated={onExpenseCreated}
      />
      <DeleteExpenseDialog
        expenseName={deleteTarget?.name ?? ''}
        open={deleteTarget !== null}
        isSubmitting={deleteSubmitting}
        errorMessage={deleteError}
        onOpenChange={onDeleteOpenChange}
        onConfirm={onConfirmDeleteExpense}
      />
    </>
  );
}
