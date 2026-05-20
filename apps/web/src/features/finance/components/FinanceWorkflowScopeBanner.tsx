'use client';

const CLOSED_EXPENSE_HINT =
  'Showing terminal outcomes only: Paid and Cancelled. Same board and list views as the active expense board.';

export function FinanceWorkflowScopeBanner({ variant }: { variant: 'expense-closed' }) {
  if (variant !== 'expense-closed') return null;

  return <p className="text-muted-foreground shrink-0 text-xs">{CLOSED_EXPENSE_HINT}</p>;
}
