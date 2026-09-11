'use client';

import {
  FINANCE_CALENDAR_CELL_EMPTY,
  FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import { formatAmountAbbreviated } from '@/features/finance/constants/finance';
import type { SubscriptionGridCell } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import {
  SUBSCRIPTION_MOBILE_CURRENT_MONTH_CLASS,
  SUBSCRIPTION_MOBILE_MONTH_CAPTION_CLASS,
  SUBSCRIPTION_MOBILE_MONTH_CELL_CLASS,
  SUBSCRIPTION_MOBILE_MONTH_GRID_CLASS,
} from './subscription-coverage-grid-constants';
import type { SubscriptionCalendarMonthLabel } from './subscription-coverage-grid-types';
import { SubscriptionCoverageMobileMonthCell } from './SubscriptionCoverageMobileMonthCell';

interface SubscriptionCoverageMobileMonthGridProps {
  months: SubscriptionCalendarMonthLabel[];
  cells: SubscriptionGridCell[];
  currentMonthIndex: number | null;
  onOpenMonth: (monthIndex: number, invoiceId: string | null) => void;
}

export function SubscriptionCoverageMobileMonthGrid({
  months,
  cells,
  currentMonthIndex,
  onOpenMonth,
}: SubscriptionCoverageMobileMonthGridProps) {
  return (
    <div className={SUBSCRIPTION_MOBILE_MONTH_GRID_CLASS}>
      {months.map((month) => {
        const cell = cells[month.key];
        if (!cell) return null;
        return (
          <SubscriptionCoverageMobileMonthCell
            key={month.key}
            caption={month.label}
            cell={cell}
            isCurrentMonth={currentMonthIndex === month.key}
            onOpen={() => onOpenMonth(month.key, cell.invoiceId)}
          />
        );
      })}
    </div>
  );
}

interface SubscriptionCoverageMobileTotalsGridProps {
  months: SubscriptionCalendarMonthLabel[];
  totals: number[];
  currentMonthIndex: number | null;
}

export function SubscriptionCoverageMobileTotalsGrid({
  months,
  totals,
  currentMonthIndex,
}: SubscriptionCoverageMobileTotalsGridProps) {
  return (
    <div className={SUBSCRIPTION_MOBILE_MONTH_GRID_CLASS}>
      {months.map((month) => (
        <SubscriptionCoverageMobileTotalCell
          key={month.key}
          label={month.label}
          total={totals[month.key] ?? 0}
          isCurrentMonth={currentMonthIndex === month.key}
        />
      ))}
    </div>
  );
}

function SubscriptionCoverageMobileTotalCell({
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
        SUBSCRIPTION_MOBILE_MONTH_CELL_CLASS,
        empty ? FINANCE_CALENDAR_CELL_EMPTY : FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
        isCurrentMonth && SUBSCRIPTION_MOBILE_CURRENT_MONTH_CLASS,
      )}
    >
      <span className={SUBSCRIPTION_MOBILE_MONTH_CAPTION_CLASS}>{label}</span>
      <span className="max-w-full truncate text-xs font-bold tabular-nums">
        {empty ? '—' : formatAmountAbbreviated(total)}
      </span>
    </div>
  );
}
