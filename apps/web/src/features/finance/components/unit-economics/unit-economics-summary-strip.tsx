'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsFilteredTotals } from '@/features/finance/components/unit-economics/compute-unit-economics-filtered-totals';
import { unitEconomicsMarginClass } from '@/features/finance/components/unit-economics/unit-economics-money';
import { cn } from '@/lib/utils';

function SummaryCell({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: number;
  accentClass?: string;
}) {
  return (
    <div className="border-border bg-card min-w-[7rem] flex-1 rounded-xl border px-3 py-2.5">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className={cn('mt-1 text-base font-semibold tabular-nums', accentClass)}>
        {formatAmount(value)}
      </p>
    </div>
  );
}

export function UnitEconomicsSummaryStrip({ totals }: { totals: UnitEconomicsFilteredTotals }) {
  if (totals.unitCount === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs tabular-nums">
          {totals.unitCount} delivery unit{totals.unitCount === 1 ? '' : 's'} in view
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <SummaryCell label="Received" value={totals.receivedAmount} />
        <SummaryCell label="To receive" value={totals.receivableAmount} />
        <SummaryCell label="Spent" value={totals.spentAmount} />
        <SummaryCell label="Bonus to pay" value={totals.remainingBonuses} />
        <SummaryCell
          label="Cash"
          value={totals.cashBalance}
          accentClass={cn('font-semibold', unitEconomicsMarginClass(totals.cashBalance))}
        />
        <SummaryCell
          label="Margin"
          value={totals.marginAfterCommitments}
          accentClass={cn('font-semibold', unitEconomicsMarginClass(totals.marginAfterCommitments))}
        />
      </div>
    </div>
  );
}
