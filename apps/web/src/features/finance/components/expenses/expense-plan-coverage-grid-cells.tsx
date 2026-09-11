'use client';

import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { FINANCE_CALENDAR_CELL_EMPTY } from '@/features/finance/constants/finance-calendar-cell-colors';
import { formatAmount, formatAmountAbbreviated } from '@/features/finance/constants/finance';
import type { ExpensePlanGridCell } from '@/lib/api/expense-plans';
import { cn } from '@/lib/utils';
import {
  expensePlanMonthCellStatusLabel,
  expensePlanMonthCellVisualClass,
} from './expense-plan-coverage-cell-visual';

/** Same slot size as `/finance/salary` calendar cells. */
export const EXPENSE_PLAN_CALENDAR_SLOT_CLASS = 'h-16 w-full';

const MONTH_CELL_BLOCK_CLASS =
  'flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1.5 text-center transition-colors';

/** `preferFullTotal` → full; else abbreviated (same as salary calendar totals). */
export function formatExpensePlanGridAmount(amount: number, preferFullTotal: boolean): string {
  return preferFullTotal ? formatAmount(amount) : formatAmountAbbreviated(amount);
}

export function ExpensePlanCompactAmount({
  value,
  preferFullTotal,
  size = 'sm',
}: {
  value: number;
  preferFullTotal: boolean;
  size?: 'sm' | 'base';
}) {
  const display = formatExpensePlanGridAmount(value, preferFullTotal);
  const fullAmount = formatAmount(value);
  const isCompact = !preferFullTotal;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center text-center',
        size === 'sm' && EXPENSE_PLAN_CALENDAR_SLOT_CLASS,
      )}
      title={isCompact ? fullAmount : undefined}
    >
      <span
        className={cn(
          'inline-flex max-w-full items-baseline justify-center gap-0.5',
          isCompact && 'truncate',
        )}
      >
        <span
          className={cn(
            'truncate leading-tight font-bold tabular-nums',
            size === 'base' ? 'text-base' : 'text-sm',
          )}
        >
          {display}
        </span>
        {isCompact ? (
          <AmdCurrencyIcon
            className={cn('shrink-0 font-bold opacity-90', size === 'base' ? 'text-sm' : 'text-xs')}
          />
        ) : null}
      </span>
    </div>
  );
}

export function ExpensePlanEmptyMonthCell() {
  return (
    <div className={cn(FINANCE_CALENDAR_CELL_EMPTY, EXPENSE_PLAN_CALENDAR_SLOT_CLASS)} aria-hidden>
      —
    </div>
  );
}

export function ExpensePlanGridMonthCell({
  cell,
  onOpen,
}: {
  cell: ExpensePlanGridCell;
  onOpen: () => void;
}) {
  if (cell.kind === 'NA') {
    return <ExpensePlanEmptyMonthCell />;
  }

  const fullAmount = formatAmount(cell.amount);
  const amountLabel = formatAmountAbbreviated(cell.amount);
  const statusLabel = expensePlanMonthCellStatusLabel(cell.kind);

  return (
    <button
      type="button"
      className={cn(
        MONTH_CELL_BLOCK_CLASS,
        EXPENSE_PLAN_CALENDAR_SLOT_CLASS,
        expensePlanMonthCellVisualClass(cell.kind),
      )}
      title={fullAmount}
      aria-label={`${statusLabel} · ${fullAmount}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      <span className="max-w-full truncate text-sm leading-tight font-bold tabular-nums">
        {amountLabel}
      </span>
    </button>
  );
}
