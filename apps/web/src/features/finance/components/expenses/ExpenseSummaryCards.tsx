'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { ExpenseStats } from '@/lib/api/finance';

const SUMMARY_LABELS = {
  default: { total: 'Total Expenses', paid: 'Paid', unpaid: 'Unpaid' },
  backlog: {
    total: 'Delayed total',
    paid: 'Paid in scope',
    unpaid: 'Unpaid in scope',
  },
} as const;

interface ExpenseSummaryCardsProps {
  stats: ExpenseStats | null;
  /** Backlog list scopes stats to Delayed expenses; labels reflect that. */
  variant?: keyof typeof SUMMARY_LABELS;
}

export function ExpenseSummaryCards({ stats, variant = 'default' }: ExpenseSummaryCardsProps) {
  const labels = SUMMARY_LABELS[variant];
  const totalExpenses = Number(stats?.totalAmount ?? 0);
  const paidExpenses = Number(stats?.paidAmount ?? 0);
  const unpaidExpenses = Number(stats?.unpaidAmount ?? 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">{labels.total}</p>
        <p className="mt-1 text-xl font-bold">{formatAmount(totalExpenses)}</p>
      </div>
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">{labels.paid}</p>
        <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(paidExpenses)}</p>
      </div>
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">{labels.unpaid}</p>
        <p className="mt-1 text-xl font-bold text-amber-600">{formatAmount(unpaidExpenses)}</p>
      </div>
    </div>
  );
}
