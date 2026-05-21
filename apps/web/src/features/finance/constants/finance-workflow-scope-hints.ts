/** Scope hints for finance workflow boards (hero secondary row). */
export const FINANCE_WORKFLOW_SCOPE_HINTS = {
  'expense-active':
    'Active payment board: Planned through On hold. Use Scope for backlog or closed terminal views.',
  'expense-backlog':
    'Deferred queue (BACKLOG status only). List view — not on the active payment board.',
  'expense-closed':
    'Showing terminal outcomes only: Paid and Cancelled. Same board and list views as the active expense board.',
  'invoice-closed':
    'Showing terminal outcomes only: Paid and Cancelled. Same board and list views as the active invoice board.',
} as const;

export type FinanceWorkflowScopeVariant = keyof typeof FINANCE_WORKFLOW_SCOPE_HINTS;

export type ExpensePageScopeVariant = 'default' | 'backlog' | 'closed';

/** Maps expense list route variant to hero scope hint. */
export function resolveExpenseWorkflowScopeVariant(
  pageVariant: ExpensePageScopeVariant,
): FinanceWorkflowScopeVariant {
  if (pageVariant === 'closed') return 'expense-closed';
  if (pageVariant === 'backlog') return 'expense-backlog';
  return 'expense-active';
}
