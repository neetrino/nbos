'use client';

import { formatAmount, parseMoneyAmount } from '@/features/finance/constants/finance';
import { unitEconomicsMarginClass } from '@/features/finance/components/unit-economics/unit-economics-money';
import type {
  UnitEconomicsDrilldownFocus,
  UnitEconomicsOrderDetail,
} from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

const SUMMARY_CELLS: Array<{
  label: string;
  pick: (detail: UnitEconomicsOrderDetail) => string;
  focus: UnitEconomicsDrilldownFocus | null;
}> = [
  { label: 'Received', pick: (detail) => detail.summary.receivedAmount, focus: 'payments' },
  { label: 'To receive', pick: (detail) => detail.summary.receivableAmount, focus: 'invoices' },
  { label: 'Spent', pick: (detail) => detail.summary.outFactAmount, focus: 'expenses' },
  { label: 'Bonus to pay', pick: (detail) => detail.summary.remainingBonuses, focus: 'bonuses' },
  { label: 'Cash balance', pick: (detail) => detail.summary.cashBalance, focus: null },
  { label: 'Out committed', pick: (detail) => detail.summary.outCommittedAmount, focus: null },
  {
    label: 'Margin',
    pick: (detail) => detail.summary.marginAfterCommitments,
    focus: null,
  },
  { label: 'Bonus plan', pick: (detail) => detail.summary.plannedBonuses, focus: 'bonuses' },
];

export function UnitEconomicsDrilldownSheetSummary({
  detail,
  onFocusChange,
}: {
  detail: UnitEconomicsOrderDetail;
  onFocusChange?: (focus: UnitEconomicsDrilldownFocus) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SUMMARY_CELLS.map((cell) => {
        const value = parseMoneyAmount(cell.pick(detail));
        const isMarginLike = cell.label === 'Margin' || cell.label === 'Cash balance';
        const body = (
          <>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              {cell.label}
            </p>
            <p
              className={cn(
                'mt-1 text-base font-semibold tabular-nums',
                isMarginLike && unitEconomicsMarginClass(value),
              )}
            >
              {formatAmount(value)}
            </p>
          </>
        );

        if (cell.focus && onFocusChange) {
          return (
            <button
              key={cell.label}
              type="button"
              className="border-border bg-card hover:bg-muted/40 rounded-xl border px-3 py-2 text-left transition-colors"
              onClick={() => onFocusChange(cell.focus as UnitEconomicsDrilldownFocus)}
            >
              {body}
            </button>
          );
        }

        return (
          <div key={cell.label} className="border-border bg-card rounded-xl border px-3 py-2">
            {body}
          </div>
        );
      })}
    </div>
  );
}
