'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type { UnitEconomicsFilteredTotals } from '@/features/finance/components/unit-economics/compute-unit-economics-filtered-totals';
import {
  unitEconomicsGroupAmountClass,
  unitEconomicsGroupSummaryCardClass,
  unitEconomicsGroupSummaryLabelClass,
  type UnitEconomicsColumnGroup,
} from '@/features/finance/components/unit-economics/unit-economics-column-groups';
import { cn } from '@/lib/utils';

function SummaryCell({
  group,
  label,
  value,
  fontMedium = false,
}: {
  group: UnitEconomicsColumnGroup;
  label: string;
  value: number;
  fontMedium?: boolean;
}) {
  return (
    <div className={unitEconomicsGroupSummaryCardClass(group)}>
      <p className={unitEconomicsGroupSummaryLabelClass(group)}>{label}</p>
      <p
        className={cn(
          'mt-1 text-base tabular-nums',
          unitEconomicsGroupAmountClass(group, value, { fontMedium: fontMedium || true }),
        )}
      >
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
        <SummaryCell group="in" label="In · Received" value={totals.receivedAmount} />
        <SummaryCell group="in" label="In · To receive" value={totals.receivableAmount} />
        <SummaryCell group="out" label="Out · Spent" value={totals.spentAmount} />
        <SummaryCell group="out" label="Out · Bonus to pay" value={totals.remainingBonuses} />
        <SummaryCell group="balance" label="Balance · Cash" value={totals.cashBalance} />
        <SummaryCell
          group="balance"
          label="Balance · Margin"
          value={totals.marginAfterCommitments}
        />
      </div>
    </div>
  );
}
