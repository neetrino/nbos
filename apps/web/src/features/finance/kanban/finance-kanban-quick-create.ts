import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import type { Expense, Invoice } from '@/lib/api/finance';

export const INVOICE_INBOX_STAGE_KEY = 'NEW';
export const EXPENSE_INBOX_STAGE_KEY = 'PLANNED';

const DEFAULT_INVOICE_QUICK_CREATE_LABEL = 'Quick Invoice';

export function createInvoiceKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
  buttonLabel = DEFAULT_INVOICE_QUICK_CREATE_LABEL,
): KanbanColumnQuickCreateConfig<Invoice> {
  return {
    isEnabled: (column) => column.key === INVOICE_INBOX_STAGE_KEY,
    buttonLabel,
    onOpenDialog: onOpenCreateDialog,
  };
}

const DEFAULT_EXPENSE_QUICK_CREATE_LABEL = 'Quick Expense';

export function createExpenseKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
  buttonLabel = DEFAULT_EXPENSE_QUICK_CREATE_LABEL,
): KanbanColumnQuickCreateConfig<Expense> {
  return {
    isEnabled: (column) => column.key === EXPENSE_INBOX_STAGE_KEY,
    buttonLabel,
    onOpenDialog: onOpenCreateDialog,
  };
}
