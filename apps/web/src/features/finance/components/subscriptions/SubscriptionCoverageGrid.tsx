'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Subscription, SubscriptionGridPayload } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FINANCE_CALENDAR_SCROLL_SHELL_CLASS,
  FINANCE_CALENDAR_STICKY_SURFACE_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import { buildSubscriptionsById } from './subscription-grid-utils';
import {
  SUBSCRIPTION_CALENDAR_SLOT_CLASS,
  SubscriptionCompactAmount,
  SubscriptionEmptyMonthCell,
  SubscriptionGridMonthCell,
  formatSubscriptionGridAmount,
} from './subscription-coverage-grid-cells';
import { SubscriptionGridRowLabel } from './SubscriptionGridRowLabel';

interface SubscriptionCoverageGridProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: SubscriptionGridPayload | null;
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}

const MIN_SUBSCRIPTION_BOARD_YEAR = 2020;
const MAX_SUBSCRIPTION_BOARD_YEAR_OFFSET = 2;

const SUB_LABEL_COL_CLASS = 'w-44 min-w-[11rem]';
const SUB_MONTH_COL_CLASS = 'w-[4.5rem]';
const SUB_TOTAL_COL_CLASS = 'w-[99px] min-w-[99px]';
const STICKY_SURFACE_CLASS = FINANCE_CALENDAR_STICKY_SURFACE_CLASS;

const STICKY_LABEL_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky top-0 left-0 z-40 border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
  STICKY_SURFACE_CLASS,
  SUB_LABEL_COL_CLASS,
);

const STICKY_LABEL_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-20 border-r border-b px-3 py-2',
  STICKY_SURFACE_CLASS,
  SUB_LABEL_COL_CLASS,
  'cursor-pointer',
);

const STICKY_TOTAL_HEADER_CLASS = cn(
  'border-border text-foreground sticky top-0 right-0 z-40 border-l border-b px-1 py-1.5 text-center text-sm font-bold tracking-wide uppercase',
  STICKY_SURFACE_CLASS,
  SUB_TOTAL_COL_CLASS,
);

const STICKY_TOTAL_CELL_CLASS = cn(
  'border-border text-foreground sticky right-0 z-20 border-l border-b p-1 align-middle text-center',
  STICKY_SURFACE_CLASS,
  SUB_TOTAL_COL_CLASS,
);

const STICKY_TOTAL_FOOTER_CLASS = cn(
  'border-border text-foreground sticky right-0 z-30 border-l p-1 align-middle text-center',
  STICKY_SURFACE_CLASS,
  SUB_TOTAL_COL_CLASS,
);

const SUB_MONTH_HEAD_CLASS = cn(
  'border-border sticky top-0 z-30 border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  STICKY_SURFACE_CLASS,
  SUB_MONTH_COL_CLASS,
);

const SUB_MONTH_CELL_CLASS = cn('border-border border-b p-1 align-middle', SUB_MONTH_COL_CLASS);

function monthLabelsForYear(year: number): { key: number; label: string }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
    return {
      key: index,
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });
}

function SubscriptionCalendarYearControl({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (year: number) => void;
}) {
  const maxYear = new Date().getFullYear() + MAX_SUBSCRIPTION_BOARD_YEAR_OFFSET;

  return (
    <div
      className="border-border bg-muted/30 inline-flex items-center gap-1 rounded-full border p-1"
      role="group"
      aria-label="Calendar year"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Previous year"
        disabled={year <= MIN_SUBSCRIPTION_BOARD_YEAR}
        onClick={() => onYearChange(year - 1)}
      >
        <ChevronLeft className="size-4" aria-hidden />
      </Button>
      <span className="text-foreground min-w-[3rem] px-1 text-center text-sm font-semibold tabular-nums">
        {year}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Next year"
        disabled={year >= maxYear}
        onClick={() => onYearChange(year + 1)}
      >
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

export function SubscriptionCoverageGrid({
  year,
  onYearChange,
  payload,
  subscriptions,
  loading,
  error,
  onRetry,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageGridProps) {
  const sidebarCollapsed = useAppSidebarCollapsed();
  const subscriptionsById = useMemo(() => buildSubscriptionsById(subscriptions), [subscriptions]);
  const months = monthLabelsForYear(year);

  if (error) {
    return (
      <div className="border-border bg-destructive/10 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
        <span>{error}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => void onRetry()}>
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return <div className="border-border bg-muted/30 h-40 animate-pulse rounded-xl border" />;
  }

  if (!payload || payload.rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No subscription rows for this year with the current filters.
      </p>
    );
  }

  return (
    <div
      className={FINANCE_CALENDAR_SCROLL_SHELL_CLASS}
      aria-label={`Subscription calendar ${year}`}
    >
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className={SUB_LABEL_COL_CLASS} />
          {months.map((month) => (
            <col key={month.key} className={SUB_MONTH_COL_CLASS} />
          ))}
          <col className={SUB_TOTAL_COL_CLASS} />
        </colgroup>
        <thead>
          <tr className={STICKY_SURFACE_CLASS}>
            <th className={cn(STICKY_LABEL_HEADER_CLASS, 'py-2 normal-case')}>
              <div
                className={cn(
                  'flex w-full gap-1',
                  sidebarCollapsed
                    ? 'flex-row items-center justify-between'
                    : 'flex-col items-start gap-1.5',
                )}
              >
                <span className="text-[10px] font-semibold tracking-wide uppercase">
                  Subscription
                </span>
                <SubscriptionCalendarYearControl year={year} onYearChange={onYearChange} />
              </div>
            </th>
            {months.map((month) => (
              <th key={month.key} className={SUB_MONTH_HEAD_CLASS}>
                <span className="text-muted-foreground text-xs font-semibold">{month.label}</span>
              </th>
            ))}
            <th className={STICKY_TOTAL_HEADER_CLASS}>Total</th>
          </tr>
        </thead>
        <tbody>
          {payload.rows.map((row) => {
            const subscription = subscriptionsById.get(row.subscriptionId);
            return (
              <tr key={row.subscriptionId} className="hover:bg-muted/15">
                <td
                  className={STICKY_LABEL_CELL_CLASS}
                  onClick={() => onOpenSubscription(row.subscriptionId)}
                >
                  <SubscriptionGridRowLabel
                    projectName={row.projectName}
                    subscription={subscription}
                    fallbackStatus={row.subscriptionStatus}
                    fallbackType={subscription?.type ?? row.subscriptionType}
                  />
                </td>
                {row.months.map((cell, idx) => (
                  <td key={idx} className={SUB_MONTH_CELL_CLASS}>
                    <SubscriptionGridMonthCell
                      cell={cell}
                      amountMonthly={row.amountMonthly}
                      onOpen={() =>
                        onOpenMonthCell({
                          subscriptionId: row.subscriptionId,
                          invoiceId: cell.invoiceId,
                        })
                      }
                    />
                  </td>
                ))}
                <td className={STICKY_TOTAL_CELL_CLASS}>
                  <SubscriptionCompactAmount
                    value={row.annualTotal}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={cn(STICKY_SURFACE_CLASS, 'font-medium')}>
            <td
              className={cn(
                'border-border text-muted-foreground sticky left-0 z-20 border-t border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
                STICKY_SURFACE_CLASS,
                SUB_LABEL_COL_CLASS,
              )}
            >
              Month total
            </td>
            {payload.monthTotals.map((total, idx) => (
              <td key={idx} className={cn(SUB_MONTH_CELL_CLASS, 'border-t', STICKY_SURFACE_CLASS)}>
                {total > 0 ? (
                  <div
                    className={cn(
                      'border-border bg-muted/20 flex items-center justify-center truncate rounded-md border px-0.5 text-sm font-bold tabular-nums',
                      SUBSCRIPTION_CALENDAR_SLOT_CLASS,
                    )}
                    title={formatAmount(total)}
                  >
                    {formatSubscriptionGridAmount(total, false)}
                  </div>
                ) : (
                  <SubscriptionEmptyMonthCell />
                )}
              </td>
            ))}
            <td className={cn(STICKY_TOTAL_FOOTER_CLASS, 'border-t')}>
              <SubscriptionCompactAmount
                value={payload.grandAnnualTotal}
                sidebarCollapsed={sidebarCollapsed}
                size="base"
              />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
