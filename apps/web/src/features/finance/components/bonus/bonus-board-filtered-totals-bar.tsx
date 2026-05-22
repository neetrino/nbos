'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { BonusBoardFilteredTotals } from '@/features/finance/utils/bonus-board-filtered-totals';

export function BonusBoardFilteredTotalsBar({ totals }: { totals: BonusBoardFilteredTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:max-w-md">
      <div className="border-border bg-card rounded-xl border px-4 py-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Visible entries
        </p>
        <p className="text-foreground mt-1 text-lg font-semibold tabular-nums">
          {totals.entryCount}
        </p>
      </div>
      <div className="border-border bg-card rounded-xl border px-4 py-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Pipeline total
        </p>
        <p className="text-foreground mt-1 text-lg font-semibold tabular-nums">
          {formatAmount(totals.totalAmount)}
        </p>
      </div>
    </div>
  );
}
