'use client';

import { formatAmountAbbreviated } from '@/features/finance/constants/finance';
import type { SubscriptionGridCell } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import {
  subscriptionMonthCellStatusLabel,
  subscriptionMonthCellVisualClass,
} from './subscription-coverage-cell-visual';
import {
  SUBSCRIPTION_MOBILE_CURRENT_MONTH_CLASS,
  SUBSCRIPTION_MOBILE_MONTH_CAPTION_CLASS,
  SUBSCRIPTION_MOBILE_MONTH_CELL_CLASS,
} from './subscription-coverage-grid-constants';
import { monthCellKindLabel } from './subscription-grid-utils';

interface SubscriptionCoverageMobileMonthCellProps {
  caption: string;
  cell: SubscriptionGridCell;
  isCurrentMonth: boolean;
  onOpen: () => void;
}

export function SubscriptionCoverageMobileMonthCell({
  caption,
  cell,
  isCurrentMonth,
  onOpen,
}: SubscriptionCoverageMobileMonthCellProps) {
  if (cell.kind === 'NA') {
    return <SubscriptionMobileEmptyMonthCell caption={caption} isCurrentMonth={isCurrentMonth} />;
  }

  const statusLabel = subscriptionMonthCellStatusLabel(cell.kind);
  const kindLabel = monthCellKindLabel(cell.kind);
  const amountLabel =
    cell.displayAmount != null ? formatAmountAbbreviated(cell.displayAmount) : null;
  const ariaLabel = [caption, kindLabel ?? statusLabel, amountLabel].filter(Boolean).join(', ');

  return (
    <button
      type="button"
      className={cn(
        SUBSCRIPTION_MOBILE_MONTH_CELL_CLASS,
        subscriptionMonthCellVisualClass(cell.kind),
        isCurrentMonth && SUBSCRIPTION_MOBILE_CURRENT_MONTH_CLASS,
      )}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      <span className={cn(SUBSCRIPTION_MOBILE_MONTH_CAPTION_CLASS, 'opacity-80')}>{caption}</span>
      <span className="max-w-full truncate text-xs leading-tight font-bold tabular-nums">
        {amountLabel ?? statusLabel}
      </span>
    </button>
  );
}

function SubscriptionMobileEmptyMonthCell({
  caption,
  isCurrentMonth,
}: {
  caption: string;
  isCurrentMonth: boolean;
}) {
  return (
    <div
      className={cn(
        SUBSCRIPTION_MOBILE_MONTH_CELL_CLASS,
        'border-border bg-muted/20 text-muted-foreground border-dashed',
        isCurrentMonth && SUBSCRIPTION_MOBILE_CURRENT_MONTH_CLASS,
      )}
      aria-label={`${caption}, none`}
    >
      <span className={cn(SUBSCRIPTION_MOBILE_MONTH_CAPTION_CLASS, 'opacity-80')}>{caption}</span>
      <span className="text-xs">—</span>
    </div>
  );
}
