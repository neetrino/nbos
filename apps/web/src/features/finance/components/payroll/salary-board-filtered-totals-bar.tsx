'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { SalaryBoardFilteredTotals } from '@/features/finance/utils/salary-board-filtered-totals';

export function SalaryBoardFilteredTotalsBar({ totals }: { totals: SalaryBoardFilteredTotals }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <TotalTile label="Visible lines" value={String(totals.lineCount)} />
      <TotalTile label="Payable" value={formatAmount(totals.payable)} />
      <TotalTile label="Paid" value={formatAmount(totals.paid)} />
      <TotalTile label="Remaining" value={formatAmount(totals.remaining)} accent />
    </div>
  );
}

function TotalTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p
        className={
          accent
            ? 'text-foreground mt-1 text-lg font-semibold tabular-nums'
            : 'text-foreground mt-1 text-lg font-semibold tabular-nums'
        }
      >
        {value}
      </p>
    </div>
  );
}
