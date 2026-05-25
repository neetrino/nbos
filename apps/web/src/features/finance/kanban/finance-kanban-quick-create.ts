import type { KanbanColumnQuickCreateConfig } from '@/components/shared/kanban/kanban.types';
import type { Expense, Invoice } from '@/lib/api/finance';

export const INVOICE_INBOX_STAGE_KEY = 'NEW';
export const EXPENSE_INBOX_STAGE_KEY = 'PLANNED';

export function createInvoiceKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
): KanbanColumnQuickCreateConfig<Invoice> {
  return {
    isEnabled: (column) => column.key === INVOICE_INBOX_STAGE_KEY,
    buttonLabel: 'Quick Invoice',
    onOpenDialog: onOpenCreateDialog,
  };
}

export function createExpenseKanbanQuickCreateConfig(
  onOpenCreateDialog: (columnKey: string) => void,
): KanbanColumnQuickCreateConfig<Expense> {
  return {
    isEnabled: (column) => column.key === EXPENSE_INBOX_STAGE_KEY,
    buttonLabel: 'Quick Expense',
    onOpenDialog: onOpenCreateDialog,
  };
}
