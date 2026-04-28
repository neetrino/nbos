'use client';

import { formatAmount } from '@/features/finance/constants/finance';

interface ExpenseSummaryCardsProps {
  totalExpenses: number;
  paidExpenses: number;
}

export function ExpenseSummaryCards({ totalExpenses, paidExpenses }: ExpenseSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Total Expenses</p>
        <p className="mt-1 text-xl font-bold">{formatAmount(totalExpenses)}</p>
      </div>
      <div className="border-border bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Paid</p>
        <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(paidExpenses)}</p>
      </div>
    </div>
  );
}
