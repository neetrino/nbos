'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { formatAmount, formatAmountDramSuffix } from '@/features/finance/constants/finance';
import { openInvoiceWithSubscriptionHref } from '@/features/finance/constants/invoice-deep-link';
import type {
  Subscription,
  SubscriptionGridCell,
  SubscriptionGridCellKind,
  SubscriptionGridPayload,
} from '@/lib/api/finance';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  buildSubscriptionsById,
  currentMonthIndexForYear,
  pickMonthCell,
} from './subscription-grid-utils';
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
}

const GRID_YEAR_WINDOW = 3;
const SUBSCRIPTION_LABEL_COLUMN_MIN_WIDTH = '13rem';

const SUBSCRIPTION_STICKY_LABEL_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky left-0 z-40 border-r px-3 py-2 text-left font-medium',
  'bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-card',
);

const SUBSCRIPTION_STICKY_LABEL_CELL_CLASS = cn(
  'border-border sticky left-0 z-30 border-r px-2 py-0 align-middle',
  'bg-white shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-card',
  'cursor-pointer transition-colors group-hover:bg-slate-100 dark:group-hover:bg-muted',
);

const SUBSCRIPTION_STICKY_TOTAL_LABEL_CLASS = cn(
  'border-border sticky left-0 z-30 border-r px-3 py-2 font-bold',
  'bg-muted/40 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]',
);

const SUBSCRIPTION_SCROLL_CELL_CLASS =
  'relative z-0 overflow-hidden px-1 py-2 text-center align-middle transition-colors group-hover:bg-slate-50 dark:group-hover:bg-muted/50';

const SUBSCRIPTION_ANNUAL_CELL_CLASS =
  'relative z-0 px-2 py-2 text-right align-middle font-bold tabular-nums transition-colors group-hover:bg-slate-50 dark:group-hover:bg-muted/50';

function monthLabelsForYear(year: number): { key: number; label: string }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
    return {
      key: index,
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });
}

function cellVisualClasses(kind: SubscriptionGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-300';
    case 'PENDING_INVOICE':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200';
    case 'OVERDUE_INVOICE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-300';
    case 'FORECAST':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-300';
    case 'SUBSCRIPTION_PENDING':
      return 'bg-violet-50 text-violet-900 ring-2 ring-inset ring-violet-400 dark:bg-violet-950/40 dark:text-violet-200';
    case 'MISSED':
      return 'text-muted-foreground';
    default:
      return 'text-muted-foreground';
  }
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
}: SubscriptionCoverageGridProps) {
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
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="border-border bg-background h-9 rounded-md border px-2 text-sm"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
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
        <div className="border-border isolate min-w-0 overflow-x-auto rounded-xl border">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="bg-muted/40">
              <tr>
                <th
                  className={SUBSCRIPTION_STICKY_LABEL_HEADER_CLASS}
                  style={{ minWidth: SUBSCRIPTION_LABEL_COLUMN_MIN_WIDTH }}
                >
                  Subscription
                </th>
                {months.map((month) => (
                  <th
                    key={month.key}
                    className="text-muted-foreground min-w-[4.75rem] px-0.5 py-2 text-center font-medium"
                  >
                    {month.label}
                  </th>
                ))}
                <th className="text-muted-foreground min-w-[3.5rem] px-2 py-2 text-right font-medium">
                  Annual
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {payload.rows.map((row) => {
                const subscription = subscriptionsById.get(row.subscriptionId);
                const currentMonthCell = pickMonthCell(row.months, currentMonthIndex);
                return (
                  <tr key={row.subscriptionId} className="group">
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
                      <td key={idx} className={SUBSCRIPTION_SCROLL_CELL_CLASS}>
                        <GridMonthCell row={row} cell={cell} amountMonthly={row.amountMonthly} />
                      </td>
                    ))}
                    <td className={SUBSCRIPTION_ANNUAL_CELL_CLASS}>
                      <CompactAmount
                        value={row.annualTotal}
                        title={formatAmount(row.annualTotal)}
                      />
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-muted/30 font-bold">
                <td className={SUBSCRIPTION_STICKY_TOTAL_LABEL_CLASS}>Total</td>
                {payload.monthTotals.map((total, idx) => (
                  <td key={idx} className={SUBSCRIPTION_SCROLL_CELL_CLASS}>
                    {total > 0 ? <CompactAmount value={total} title={formatAmount(total)} /> : '—'}
                  </td>
                ))}
                <td className="px-2 py-2 text-right">
                  <CompactAmount
                    value={payload.grandAnnualTotal}
                    title={formatAmount(payload.grandAnnualTotal)}
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

function CompactAmount({ value, title }: { value: number; title: string }) {
  return (
    <span className="tabular-nums" title={title}>
      {formatAmountDramSuffix(value)}
    </span>
  );
}

function GridMonthCell({
  row,
  cell,
  amountMonthly,
}: {
  row: { subscriptionId: string; amountMonthly: number };
  cell: SubscriptionGridCell;
  amountMonthly: number;
}) {
  if (cell.kind === 'NA') {
    return <span className="text-muted-foreground">—</span>;
  }

  const label = formatAmountDramSuffix(amountMonthly);
  const title = formatAmount(amountMonthly);
  const cls = cn(
    'relative z-0 inline-block rounded px-1 py-0.5 text-[10px] font-medium tabular-nums whitespace-nowrap',
    cellVisualClasses(cell.kind),
  );

  if (cell.invoiceId) {
    return (
      <Link
        href={openInvoiceWithSubscriptionHref(row.subscriptionId, cell.invoiceId)}
        className={cls}
        title={title}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </Link>
    );
  }

  return (
    <span className={cls} title={title}>
      {label}
    </span>
  );
}
