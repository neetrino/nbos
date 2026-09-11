'use client';

import type { ReactNode } from 'react';
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { FINANCE_CALENDAR_CELL_EMPTY } from '@/features/finance/constants/finance-calendar-cell-colors';
import { formatAmount, formatAmountAbbreviated } from '@/features/finance/constants/finance';
import type { SubscriptionGridCell, SubscriptionGridCellKind } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { SubscriptionAmountHover } from './subscription-amount-hover';
import {
  subscriptionMonthCellStatusLabel,
  subscriptionMonthCellVisualClass,
} from './subscription-coverage-cell-visual';

/** Same slot size as expense-plans / salary calendar cells. */
export const SUBSCRIPTION_CALENDAR_SLOT_CLASS = 'h-16 w-full';

const MONTH_CELL_BLOCK_CLASS =
  'flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1.5 text-center transition-colors';

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
  const isCompact = !preferFullTotal;

  const body = (
    <div
      className={cn(
        'flex w-full items-center justify-center text-center',
        size === 'sm' && SUBSCRIPTION_CALENDAR_SLOT_CLASS,
      )}
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

  return isCompact ? (
    <SubscriptionAmountHover amount={value}>{body}</SubscriptionAmountHover>
  ) : (
    body
  );
}

export function SubscriptionEmptyMonthCell() {
  return (
    <div className={cn(FINANCE_CALENDAR_CELL_EMPTY, SUBSCRIPTION_CALENDAR_SLOT_CLASS)} aria-hidden>
      —
    </div>
  );
}

function MonthCellButton({
  kind,
  statusLabel,
  onOpen,
  children,
}: {
  kind: SubscriptionGridCellKind;
  statusLabel: string;
  onOpen: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        MONTH_CELL_BLOCK_CLASS,
        SUBSCRIPTION_CALENDAR_SLOT_CLASS,
        subscriptionMonthCellVisualClass(kind),
      )}
      aria-label={statusLabel}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      {children}
    </button>
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
  const amountLabel = hasAmount ? formatAmountAbbreviated(amount) : null;
  const statusLabel = subscriptionMonthCellStatusLabel(cell.kind);
  const body = amountLabel ? (
    <span className="max-w-full truncate text-sm leading-tight font-bold tabular-nums">
      {amountLabel}
    </span>
  ) : null;

  if (!hasAmount) {
    return (
      <MonthCellButton kind={cell.kind} statusLabel={statusLabel} onOpen={onOpen}>
        {body}
      </MonthCellButton>
    );
  }

  return (
    <SubscriptionAmountHover
      amount={amount}
      trigger={<MonthCellButton kind={cell.kind} statusLabel={statusLabel} onOpen={onOpen} />}
    >
      {body}
    </SubscriptionAmountHover>
  );
}
