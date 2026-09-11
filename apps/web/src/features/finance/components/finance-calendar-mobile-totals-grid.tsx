'use client';

import {
  FINANCE_CALENDAR_CELL_EMPTY,
  FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import {
  FINANCE_CALENDAR_MOBILE_CURRENT_MONTH_CLASS,
  FINANCE_CALENDAR_MOBILE_MONTH_CAPTION_CLASS,
  FINANCE_CALENDAR_MOBILE_MONTH_CELL_CLASS,
  FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS,
  type FinanceCalendarMonthLabel,
} from '@/features/finance/constants/finance-calendar-mobile';
import { formatAmountAbbreviated } from '@/features/finance/constants/finance';
import { cn } from '@/lib/utils';

interface FinanceCalendarMobileTotalsGridProps {
  months: FinanceCalendarMonthLabel[];
  totals: number[];
  currentMonthIndex: number | null;
}

export function FinanceCalendarMobileTotalsGrid({
  months,
  totals,
  currentMonthIndex,
}: FinanceCalendarMobileTotalsGridProps) {
  return (
    <div className={FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS}>
      {months.map((month) => (
        <FinanceCalendarMobileTotalCell
          key={month.key}
          label={month.label}
          total={totals[month.key] ?? 0}
          isCurrentMonth={currentMonthIndex === month.key}
        />
      ))}
    </div>
  );
}

function FinanceCalendarMobileTotalCell({
  label,
  total,
  isCurrentMonth,
}: {
  label: string;
  total: number;
  isCurrentMonth: boolean;
}) {
  const empty = total <= 0;
  return (
    <div
      className={cn(
        FINANCE_CALENDAR_MOBILE_MONTH_CELL_CLASS,
        empty ? FINANCE_CALENDAR_CELL_EMPTY : FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
        isCurrentMonth && FINANCE_CALENDAR_MOBILE_CURRENT_MONTH_CLASS,
      )}
    >
      <span className={FINANCE_CALENDAR_MOBILE_MONTH_CAPTION_CLASS}>{label}</span>
      <span className="max-w-full truncate text-xs font-bold tabular-nums">
        {empty ? '—' : formatAmountAbbreviated(total)}
      </span>
    </div>
  );
}
