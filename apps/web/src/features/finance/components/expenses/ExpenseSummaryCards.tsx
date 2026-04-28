'use client';

import { Skeleton } from '@/components/ui/skeleton';
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
  loading?: boolean;
  /** Backlog list scopes stats to Delayed expenses; labels reflect that. */
  variant?: keyof typeof SUMMARY_LABELS;
}

export function ExpenseSummaryCards({
  stats,
  variant = 'default',
  loading = false,
}: ExpenseSummaryCardsProps) {
  const labels = SUMMARY_LABELS[variant];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-busy aria-live="polite">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-border bg-card rounded-xl border p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

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
