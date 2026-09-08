'use client';

import type { Expense } from '@/lib/api/finance';
import { CreateExpenseDialog } from './CreateExpenseDialog';

interface ExpensesPageDialogsProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  /** When set, new expense form defaults to this status (backlog → Delayed). */
  defaultCreateStatus?: string;
  onExpenseCreated: (created: Expense) => void;
}

export function ExpensesPageDialogs({
  createOpen,
  onCreateOpenChange,
  defaultCreateStatus,
  onExpenseCreated,
}: ExpensesPageDialogsProps) {
  return (
    <CreateExpenseDialog
      open={createOpen}
      onOpenChange={onCreateOpenChange}
      defaultProductId={null}
      defaultStatus={defaultCreateStatus}
      onCreated={onExpenseCreated}
    />
  );
}
