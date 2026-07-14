'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import type { Subscription, SubscriptionGridPayload } from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import {
  buildSubscriptionsById,
  currentMonthIndexForYear,
  pickMonthCell,
} from './subscription-grid-utils';
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
  activatingId: string | null;
  cancellingId: string | null;
  holdingId: string | null;
  onActivate: (subscription: Subscription) => void;
  onCancel: (subscription: Subscription) => Promise<void>;
  onHold: (subscription: Subscription) => Promise<void>;
  onOpenSubscription: (subscriptionId: string) => void;
  onOpenMonthCell: (args: { subscriptionId: string; invoiceId: string | null }) => void;
}

const GRID_YEAR_WINDOW = 3;
const SUBSCRIPTION_LABEL_COLUMN_MIN_WIDTH = '13rem';
const SUBSCRIPTION_MONTH_COL_CLASS = 'w-[4.5rem] min-w-[4.5rem]';

const SUBSCRIPTION_STICKY_LABEL_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky left-0 z-40 border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
  'bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-card',
);

const SUBSCRIPTION_STICKY_LABEL_CELL_CLASS = cn(
  'border-border sticky left-0 z-30 border-r border-b px-2 py-2 align-middle',
  'bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-card',
  'cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-muted/40',
);

const SUBSCRIPTION_STICKY_TOTAL_LABEL_CLASS = cn(
  'border-border sticky left-0 z-30 border-r px-3 py-2 font-bold',
  'bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-card',
);

const SUBSCRIPTION_MONTH_CELL_CLASS = cn(
  'border-border border-b p-1 align-middle',
  SUBSCRIPTION_MONTH_COL_CLASS,
);

const SUBSCRIPTION_ANNUAL_CELL_CLASS =
  'border-border relative z-0 border-b px-2 py-2 text-right align-middle text-sm font-bold tabular-nums';

const SUBSCRIPTION_MONTH_HEAD_CLASS = cn(
  'border-border text-muted-foreground border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  SUBSCRIPTION_MONTH_COL_CLASS,
);

function monthLabelsForYear(year: number): { key: number; label: string }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
    return {
      key: index,
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });
}

export function SubscriptionCoverageGrid({
  year,
  onYearChange,
  payload,
  subscriptions,
  loading,
  error,
  onRetry,
  activatingId,
  cancellingId,
  holdingId,
  onActivate,
  onCancel,
  onHold,
  onOpenSubscription,
  onOpenMonthCell,
}: SubscriptionCoverageGridProps) {
  const sidebarCollapsed = useAppSidebarCollapsed();
  const subscriptionsById = useMemo(() => buildSubscriptionsById(subscriptions), [subscriptions]);
  const currentMonthIndex = currentMonthIndexForYear(year);
  const months = monthLabelsForYear(year);
  const cy = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: GRID_YEAR_WINDOW * 2 + 1 },
    (_, i) => cy - GRID_YEAR_WINDOW + i,
  );

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-foreground text-lg font-semibold">Subscriptions</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Year</span>
          <Select
            value={String(year)}
            onValueChange={(v) => {
              if (v) onYearChange(Number(v));
            }}
          >
            <SelectTrigger className="w-[7.5rem]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      {error ? (
        <div className="border-border bg-destructive/10 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void onRetry()}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="border-border bg-muted/30 h-40 animate-pulse rounded-xl border" />
      ) : payload && payload.rows.length > 0 ? (
        <div className="border-border isolate min-h-0 min-w-0 flex-1 overflow-x-auto rounded-xl border [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="dark:bg-card bg-white">
                <th
                  className={SUBSCRIPTION_STICKY_LABEL_HEADER_CLASS}
                  style={{ minWidth: SUBSCRIPTION_LABEL_COLUMN_MIN_WIDTH }}
                >
                  Subscription
                </th>
                {months.map((month) => (
                  <th key={month.key} className={SUBSCRIPTION_MONTH_HEAD_CLASS}>
                    {month.label}
                  </th>
                ))}
                <th className="border-border text-muted-foreground dark:bg-card border-b bg-white px-2 py-1.5 text-right text-[10px] font-semibold tracking-wide uppercase">
                  Annual
                </th>
              </tr>
            </thead>
            <tbody>
              {payload.rows.map((row) => {
                const subscription = subscriptionsById.get(row.subscriptionId);
                const currentMonthCell = pickMonthCell(row.months, currentMonthIndex);
                return (
                  <tr
                    key={row.subscriptionId}
                    className="dark:bg-card dark:hover:bg-muted/20 bg-white hover:bg-slate-50/80"
                  >
                    <td
                      className={SUBSCRIPTION_STICKY_LABEL_CELL_CLASS}
                      style={{ minWidth: SUBSCRIPTION_LABEL_COLUMN_MIN_WIDTH }}
                      onClick={() => onOpenSubscription(row.subscriptionId)}
                    >
                      <SubscriptionGridRowLabel
                        projectName={row.projectName}
                        subscription={subscription}
                        fallbackStatus={row.subscriptionStatus}
                        fallbackType={subscription?.type ?? row.subscriptionType}
                        currentMonthCell={currentMonthCell}
                        activatingId={activatingId}
                        cancellingId={cancellingId}
                        holdingId={holdingId}
                        onActivate={onActivate}
                        onCancel={onCancel}
                        onHold={onHold}
                      />
                    </td>
                    {row.months.map((cell, idx) => (
                      <td key={idx} className={SUBSCRIPTION_MONTH_CELL_CLASS}>
                        <SubscriptionGridMonthCell
                          cell={cell}
                          amountMonthly={row.amountMonthly}
                          sidebarCollapsed={sidebarCollapsed}
                          onOpen={() =>
                            onOpenMonthCell({
                              subscriptionId: row.subscriptionId,
                              invoiceId: cell.invoiceId,
                            })
                          }
                        />
                      </td>
                    ))}
                    <td className={SUBSCRIPTION_ANNUAL_CELL_CLASS}>
                      <SubscriptionCompactAmount
                        value={row.annualTotal}
                        sidebarCollapsed={sidebarCollapsed}
                      />
                    </td>
                  </tr>
                );
              })}
              <tr className="dark:bg-card bg-white font-medium">
                <td className={SUBSCRIPTION_STICKY_TOTAL_LABEL_CLASS}>Total</td>
                {payload.monthTotals.map((total, idx) => (
                  <td
                    key={idx}
                    className={cn(SUBSCRIPTION_MONTH_CELL_CLASS, 'dark:bg-card bg-white')}
                  >
                    {total > 0 ? (
                      <div
                        className={cn(
                          'flex items-center justify-center text-sm font-bold tabular-nums',
                          SUBSCRIPTION_CALENDAR_SLOT_CLASS,
                          !sidebarCollapsed && 'truncate px-0.5',
                        )}
                        title={sidebarCollapsed ? undefined : formatAmount(total)}
                      >
                        {formatSubscriptionGridAmount(total, sidebarCollapsed)}
                      </div>
                    ) : (
                      <SubscriptionEmptyMonthCell />
                    )}
                  </td>
                ))}
                <td className="dark:bg-card bg-white px-2 py-2 text-right text-sm font-bold tabular-nums">
                  <SubscriptionCompactAmount
                    value={payload.grandAnnualTotal}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No subscription rows for this year with the current filters.
        </p>
      )}
    </section>
  );
}
