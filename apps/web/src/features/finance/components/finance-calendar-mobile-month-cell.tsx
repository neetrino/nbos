'use client';

import {
  FINANCE_CALENDAR_MOBILE_CURRENT_MONTH_CLASS,
  FINANCE_CALENDAR_MOBILE_MONTH_CAPTION_CLASS,
  FINANCE_CALENDAR_MOBILE_MONTH_CELL_CLASS,
} from '@/features/finance/constants/finance-calendar-mobile';
import { cn } from '@/lib/utils';

interface FinanceCalendarMobileMonthCellProps {
  caption: string;
  isCurrentMonth: boolean;
  visualClassName: string;
  ariaLabel: string;
  amountOrStatus: string;
  onOpen: () => void;
}

export function FinanceCalendarMobileMonthCell({
  caption,
  isCurrentMonth,
  visualClassName,
  ariaLabel,
  amountOrStatus,
  onOpen,
}: FinanceCalendarMobileMonthCellProps) {
  return (
    <button
      type="button"
      className={cn(
        FINANCE_CALENDAR_MOBILE_MONTH_CELL_CLASS,
        visualClassName,
        isCurrentMonth && FINANCE_CALENDAR_MOBILE_CURRENT_MONTH_CLASS,
      )}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      <span className={cn(FINANCE_CALENDAR_MOBILE_MONTH_CAPTION_CLASS, 'opacity-80')}>{caption}</span>
      <span className="max-w-full truncate text-xs leading-tight font-bold tabular-nums">
        {amountOrStatus}
      </span>
    </button>
  );
}

export function FinanceCalendarMobileEmptyMonthCell({
  caption,
  isCurrentMonth,
}: {
  caption: string;
  isCurrentMonth: boolean;
}) {
  return (
    <div
      className={cn(
        FINANCE_CALENDAR_MOBILE_MONTH_CELL_CLASS,
        'border-border bg-muted/20 text-muted-foreground border-dashed',
        isCurrentMonth && FINANCE_CALENDAR_MOBILE_CURRENT_MONTH_CLASS,
      )}
      aria-label={`${caption}, none`}
    >
      <span className={cn(FINANCE_CALENDAR_MOBILE_MONTH_CAPTION_CLASS, 'opacity-80')}>{caption}</span>
      <span className="text-xs">—</span>
    </div>
  );
}
