'use client';

import { useMemo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FINANCE_CALENDAR_SCROLL_SHELL_CLASS } from '@/features/finance/constants/finance-calendar-cell-colors';
import { financeCalendarTotalColClass } from '@/features/finance/constants/finance-calendar-total-display';
import { useFinanceCalendarPreferFullTotal } from '@/features/finance/hooks/use-finance-calendar-prefer-full-total';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import { SubscriptionCoverageDesktopTable } from './SubscriptionCoverageDesktopTable';
import type { SubscriptionCoverageGridViewProps } from './subscription-coverage-grid-types';
import {
  buildSubscriptionsById,
  sortSubscriptionGridRows,
  subscriptionCalendarMonthLabels,
} from './subscription-grid-utils';

export function SubscriptionCoverageDesktopGrid({
  year,
  onYearChange,
  payload,
  subscriptions,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageGridViewProps) {
  const sidebarCollapsed = useAppSidebarCollapsed();
  const preferFullTotal = useFinanceCalendarPreferFullTotal(sidebarCollapsed);
  const totalColClass = financeCalendarTotalColClass(preferFullTotal);
  const subscriptionsById = useMemo(() => buildSubscriptionsById(subscriptions), [subscriptions]);
  const months = subscriptionCalendarMonthLabels(year);
  const sortedRows = useMemo(() => sortSubscriptionGridRows(payload.rows), [payload.rows]);

  return (
    <TooltipProvider delay={0}>
      <div
        className={FINANCE_CALENDAR_SCROLL_SHELL_CLASS}
        aria-label={`Subscription calendar ${year}`}
      >
        <SubscriptionCoverageDesktopTable
          year={year}
          onYearChange={onYearChange}
          months={months}
          rows={sortedRows}
          subscriptionsById={subscriptionsById}
          monthTotals={payload.monthTotals}
          grandAnnualTotal={payload.grandAnnualTotal}
          preferFullTotal={preferFullTotal}
          totalColClass={totalColClass}
          onOpenSubscription={onOpenSubscription}
          onOpenMonthCell={onOpenMonthCell}
        />
      </div>
    </TooltipProvider>
  );
}
