'use client';

import { formatAmount, parseMoneyAmount } from '@/features/finance/constants/finance';
import {
  unitEconomicsGroupAmountClass,
  unitEconomicsGroupSummaryCardClass,
  unitEconomicsGroupSummaryLabelClass,
  type UnitEconomicsColumnGroup,
} from '@/features/finance/components/unit-economics/unit-economics-column-groups';
import type {
  UnitEconomicsDrilldownFocus,
  UnitEconomicsOrderDetail,
} from '@/lib/api/unit-economics';
import { cn } from '@/lib/utils';

const SUMMARY_CELLS: Array<{
  label: string;
  group: UnitEconomicsColumnGroup;
  pick: (detail: UnitEconomicsOrderDetail) => string;
  focus: UnitEconomicsDrilldownFocus | null;
  warnIfPositive?: boolean;
}> = [
  {
    label: 'Received',
    group: 'in',
    pick: (detail) => detail.summary.receivedAmount,
    focus: 'payments',
  },
  {
    label: 'To receive',
    group: 'in',
    pick: (detail) => detail.summary.receivableAmount,
    focus: 'invoices',
  },
  {
    label: 'Spent',
    group: 'out',
    pick: (detail) => detail.summary.outFactAmount,
    focus: 'expenses',
  },
  {
    label: 'Bonus to pay',
    group: 'out',
    pick: (detail) => detail.summary.remainingBonuses,
    focus: 'bonuses',
  },
  {
    label: 'Cash balance',
    group: 'balance',
    pick: (detail) => detail.summary.cashBalance,
    focus: null,
  },
  {
    label: 'Margin',
    group: 'balance',
    pick: (detail) => detail.summary.marginAfterCommitments,
    focus: null,
  },
  {
    label: 'Out committed',
    group: 'out',
    pick: (detail) => detail.summary.outCommittedAmount,
    focus: null,
  },
  {
    label: 'Bonus plan',
    group: 'out',
    pick: (detail) => detail.summary.plannedBonuses,
    focus: 'bonuses',
  },
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
        const body = (
          <>
            <p className={unitEconomicsGroupSummaryLabelClass(cell.group)}>{cell.label}</p>
            <p
              className={cn(
                'mt-1 text-base font-semibold tabular-nums',
                unitEconomicsGroupAmountClass(cell.group, value, {
                  fontMedium: true,
                  warnIfPositive: cell.warnIfPositive,
                }),
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
              className={cn(
                'hover:bg-muted/40 text-left transition-colors',
                unitEconomicsGroupSummaryCardClass(cell.group),
              )}
              onClick={() => onFocusChange(cell.focus as UnitEconomicsDrilldownFocus)}
            >
              {body}
            </button>
          );
        }

        return (
          <div key={cell.label} className={unitEconomicsGroupSummaryCardClass(cell.group)}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
