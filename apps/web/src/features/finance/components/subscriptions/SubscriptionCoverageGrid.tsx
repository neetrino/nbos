'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import { openInvoiceWithSubscriptionHref } from '@/features/finance/constants/invoice-deep-link';
import type {
  SubscriptionGridCell,
  SubscriptionGridCellKind,
  SubscriptionGridPayload,
} from '@/lib/api/finance';
import { Button } from '@/components/ui/button';

interface SubscriptionCoverageGridProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: SubscriptionGridPayload | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenSubscription: (subscriptionId: string) => void;
}

const GRID_YEAR_WINDOW = 3;

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
      return 'bg-violet-50 text-violet-900 ring-2 ring-violet-400 dark:bg-violet-950/40 dark:text-violet-200';
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
  loading,
  error,
  onRetry,
  onOpenSubscription,
}: SubscriptionCoverageGridProps) {
  const months = monthLabelsForYear(year);
  const cy = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: GRID_YEAR_WINDOW * 2 + 1 },
    (_, i) => cy - GRID_YEAR_WINDOW + i,
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-foreground text-lg font-semibold">Subscription grid</h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            Paid / pending / overdue from Invoice Card coverage; forecast for active months without
            an invoice yet. Same filters as the list (year is selectable).
          </p>
        </div>
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
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full text-xs">
            <thead className="bg-secondary/50">
              <tr>
                <th className="bg-secondary/50 text-muted-foreground sticky left-0 z-10 px-3 py-2 text-left font-medium">
                  Project
                </th>
                {months.map((month) => (
                  <th
                    key={month.key}
                    className="text-muted-foreground min-w-[3.25rem] px-1 py-2 text-center font-medium"
                  >
                    {month.label}
                  </th>
                ))}
                <th className="text-muted-foreground px-3 py-2 text-right font-medium">Annual</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {payload.rows.map((row) => (
                <tr key={row.subscriptionId} className="hover:bg-secondary/30">
                  <td
                    className="bg-card sticky left-0 z-10 cursor-pointer px-3 py-2 font-medium"
                    onClick={() => onOpenSubscription(row.subscriptionId)}
                  >
                    <div>
                      <p>{row.projectName}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {formatAmount(row.amountMonthly)}/mo
                      </p>
                    </div>
                  </td>
                  {row.months.map((cell, idx) => (
                    <td key={idx} className="px-1 py-2 text-center">
                      <GridMonthCell row={row} cell={cell} />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-bold">
                    {formatAmount(row.annualTotal)}
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/30 font-bold">
                <td className="bg-secondary/30 sticky left-0 z-10 px-3 py-2">Total</td>
                {payload.monthTotals.map((total, idx) => (
                  <td key={idx} className="px-1 py-2 text-center">
                    {total > 0 ? formatAmount(total) : '—'}
                  </td>
                ))}
                <td className="px-3 py-2 text-right">{formatAmount(payload.grandAnnualTotal)}</td>
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

function GridMonthCell({
  row,
  cell,
}: {
  row: { subscriptionId: string; amountMonthly: number };
  cell: SubscriptionGridCell;
}) {
  if (cell.kind === 'NA') {
    return <span className="text-muted-foreground">—</span>;
  }

  const label = formatAmount(row.amountMonthly);
  const cls = `inline-block min-w-[2.75rem] rounded px-1.5 py-0.5 text-[10px] font-medium ${cellVisualClasses(cell.kind)}`;

  if (cell.invoiceId) {
    return (
      <Link
        href={openInvoiceWithSubscriptionHref(row.subscriptionId, cell.invoiceId)}
        className={`${cls} hover:opacity-90`}
        onClick={(e) => e.stopPropagation()}
      >
        {label}
      </Link>
    );
  }

  return <span className={cls}>{label}</span>;
}
