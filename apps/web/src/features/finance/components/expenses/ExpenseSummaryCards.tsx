'use client';

import { formatAmount } from '@/features/finance/constants/finance';

const SUMMARY_LABELS = {
  default: { total: 'Total Expenses', paid: 'Paid' },
  backlog: { total: 'Delayed total', paid: 'Paid in scope' },
} as const;

interface ExpenseSummaryCardsProps {
  totalExpenses: number;
  paidExpenses: number;
  /** Backlog list scopes stats to Delayed expenses; labels reflect that. */
  variant?: keyof typeof SUMMARY_LABELS;
}

export function ExpenseSummaryCards({
  totalExpenses,
  paidExpenses,
  variant = 'default',
}: ExpenseSummaryCardsProps) {
  const labels = SUMMARY_LABELS[variant];
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">{labels.total}</p>
        <p className="mt-1 text-xl font-bold">{formatAmount(totalExpenses)}</p>
      </div>
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">{labels.paid}</p>
        <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(paidExpenses)}</p>
      </div>
    </div>
  );
}
