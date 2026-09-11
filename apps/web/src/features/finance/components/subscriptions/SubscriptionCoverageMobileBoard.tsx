'use client';

import { useMemo } from 'react';
import { formatAmountAbbreviated } from '@/features/finance/constants/finance';
import { cn } from '@/lib/utils';
import {
  FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
  FinanceCalendarYearControl,
} from '../finance-calendar-year-control';
import {
  MAX_SUBSCRIPTION_BOARD_YEAR_OFFSET,
  MIN_SUBSCRIPTION_BOARD_YEAR,
  SUBSCRIPTION_MOBILE_BOARD_SCROLL_CLASS,
  SUBSCRIPTION_MOBILE_YEAR_CONTROL_WIDTH_CLASS,
} from './subscription-coverage-grid-constants';
import type { SubscriptionCoverageGridViewProps } from './subscription-coverage-grid-types';
import { SubscriptionCoverageMobileCard } from './SubscriptionCoverageMobileCard';
import { SubscriptionCoverageMobileTotalsGrid } from './SubscriptionCoverageMobileMonthGrid';
import {
  buildSubscriptionsById,
  currentMonthIndexForYear,
  sortSubscriptionGridRows,
  subscriptionCalendarMonthLabels,
} from './subscription-grid-utils';

export function SubscriptionCoverageMobileBoard({
  year,
  onYearChange,
  payload,
  subscriptions,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageGridViewProps) {
  const months = subscriptionCalendarMonthLabels(year);
  const currentMonthIndex = currentMonthIndexForYear(year);
  const sortedRows = useMemo(() => sortSubscriptionGridRows(payload.rows), [payload.rows]);
  const subscriptionsById = useMemo(() => buildSubscriptionsById(subscriptions), [subscriptions]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3" aria-label={`Subscription board ${year}`}>
      <SubscriptionCoverageMobileToolbar
        year={year}
        onYearChange={onYearChange}
        rowCount={sortedRows.length}
        grandAnnualTotal={payload.grandAnnualTotal}
      />
      <div className={SUBSCRIPTION_MOBILE_BOARD_SCROLL_CLASS}>
        <section className="border-border bg-card space-y-2 rounded-2xl border p-4">
          <h3 className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            Month totals
          </h3>
          <SubscriptionCoverageMobileTotalsGrid
            months={months}
            totals={payload.monthTotals}
            currentMonthIndex={currentMonthIndex}
          />
        </section>
        {sortedRows.map((row) => (
          <SubscriptionCoverageMobileCard
            key={row.subscriptionId}
            row={row}
            subscription={subscriptionsById.get(row.subscriptionId)}
            months={months}
            currentMonthIndex={currentMonthIndex}
            onOpenSubscription={onOpenSubscription}
            onOpenMonthCell={onOpenMonthCell}
          />
        ))}
      </div>
    </div>
  );
}

function SubscriptionCoverageMobileToolbar({
  year,
  onYearChange,
  rowCount,
  grandAnnualTotal,
}: {
  year: number;
  onYearChange: (year: number) => void;
  rowCount: number;
  grandAnnualTotal: number;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div
        className={cn(
          FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
          SUBSCRIPTION_MOBILE_YEAR_CONTROL_WIDTH_CLASS,
        )}
      >
        <FinanceCalendarYearControl
          year={year}
          onYearChange={onYearChange}
          minYear={MIN_SUBSCRIPTION_BOARD_YEAR}
          maxYearOffset={MAX_SUBSCRIPTION_BOARD_YEAR_OFFSET}
        />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
          {rowCount} subscriptions
        </p>
        <p className="text-foreground truncate text-base font-bold tabular-nums">
          {formatAmountAbbreviated(grandAnnualTotal)}
        </p>
      </div>
    </div>
  );
}
