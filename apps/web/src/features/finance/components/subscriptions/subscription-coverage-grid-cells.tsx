'use client';

import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import {
  FINANCE_CALENDAR_CELL_AMBER,
  FINANCE_CALENDAR_CELL_BLUE,
  FINANCE_CALENDAR_CELL_EMPTY,
  FINANCE_CALENDAR_CELL_GREEN,
  FINANCE_CALENDAR_CELL_MUTED,
  FINANCE_CALENDAR_CELL_ORANGE,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import { formatAmount, formatAmountAbbreviated } from '@/features/finance/constants/finance';
import type { SubscriptionGridCell, SubscriptionGridCellKind } from '@/lib/api/finance';
import { cn } from '@/lib/utils';

/** Same slot size as expense-plans / salary calendar cells. */
export const SUBSCRIPTION_CALENDAR_SLOT_CLASS = 'h-16 w-full';

const MONTH_CELL_BLOCK_CLASS =
  'flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1.5 text-center transition-colors';

function cellVisualClasses(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return FINANCE_CALENDAR_CELL_GREEN;
    case 'PENDING_INVOICE':
      return FINANCE_CALENDAR_CELL_AMBER;
    case 'OVERDUE_INVOICE':
      return FINANCE_CALENDAR_CELL_ORANGE;
    case 'FORECAST':
      return FINANCE_CALENDAR_CELL_BLUE;
    case 'SUBSCRIPTION_PENDING':
      return FINANCE_CALENDAR_CELL_AMBER;
    case 'MISSED':
      return FINANCE_CALENDAR_CELL_MUTED;
    default:
      return 'border-border bg-muted/20 text-muted-foreground';
  }
}

function cellStatusLabel(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'Paid';
    case 'PENDING_INVOICE':
      return 'Invoice';
    case 'OVERDUE_INVOICE':
      return 'Overdue';
    case 'FORECAST':
      return 'Forecast';
    case 'SUBSCRIPTION_PENDING':
      return 'Pending';
    case 'MISSED':
      return 'Missed';
    default:
      return '';
  }
}

/** `preferFullTotal` → full; else abbreviated. */
export function formatSubscriptionGridAmount(amount: number, preferFullTotal: boolean): string {
  return preferFullTotal ? formatAmount(amount) : formatAmountAbbreviated(amount);
}

export function SubscriptionCompactAmount({
  value,
  preferFullTotal,
  size = 'sm',
}: {
  value: number;
  preferFullTotal: boolean;
  size?: 'sm' | 'base';
}) {
  const display = formatSubscriptionGridAmount(value, preferFullTotal);
  const fullAmount = formatAmount(value);
  const isCompact = !preferFullTotal;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center text-center',
        size === 'sm' && SUBSCRIPTION_CALENDAR_SLOT_CLASS,
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

export function SubscriptionEmptyMonthCell() {
  return (
    <div className={cn(FINANCE_CALENDAR_CELL_EMPTY, SUBSCRIPTION_CALENDAR_SLOT_CLASS)} aria-hidden>
      —
    </div>
  );
}

export function SubscriptionGridMonthCell({
  cell,
  onOpen,
}: {
  cell: SubscriptionGridCell;
  onOpen: () => void;
}) {
  if (cell.kind === 'NA') {
    return <SubscriptionEmptyMonthCell />;
  }

  const amount = cell.displayAmount;
  const hasAmount = amount != null;
  const fullAmount = hasAmount ? formatAmount(amount) : undefined;
  const amountLabel = hasAmount ? formatAmountAbbreviated(amount) : null;
  const statusLabel = cellStatusLabel(cell.kind);

  return (
    <button
      type="button"
      className={cn(
        MONTH_CELL_BLOCK_CLASS,
        SUBSCRIPTION_CALENDAR_SLOT_CLASS,
        cellVisualClasses(cell.kind),
      )}
      title={fullAmount ?? statusLabel}
      aria-label={hasAmount && fullAmount ? `${statusLabel} · ${fullAmount}` : statusLabel}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      {amountLabel ? (
        <span className="max-w-full truncate text-sm leading-tight font-bold tabular-nums">
          {amountLabel}
        </span>
      ) : null}
    </button>
  );
}
