'use client';

const CLOSED_SCOPE_HINTS = {
  'expense-closed':
    'Showing terminal outcomes only: Paid and Cancelled. Same board and list views as the active expense board.',
  'invoice-closed':
    'Showing terminal outcomes only: Paid and Cancelled. Same board and list views as the active invoice board.',
} as const;

export type FinanceWorkflowScopeVariant = keyof typeof CLOSED_SCOPE_HINTS;

export function FinanceWorkflowScopeBanner({ variant }: { variant: FinanceWorkflowScopeVariant }) {
  return <p className="text-muted-foreground shrink-0 text-xs">{CLOSED_SCOPE_HINTS[variant]}</p>;
}
