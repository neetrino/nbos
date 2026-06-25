'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import type {
  ExpensePlanGridCell,
  ExpensePlanGridCellKind,
  ExpensePlanGridPayload,
} from '@/lib/api/expense-plans';
import { Button } from '@/components/ui/button';

interface ExpensePlanCoverageGridProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: ExpensePlanGridPayload | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenPlan: (planId: string) => void;
  onOpenExpense: (expenseId: string) => void;
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

function cellVisualClasses(kind: ExpensePlanGridCellKind): string {
  switch (kind) {
    case 'PAID':
      return 'bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-300';
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-300';
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-300';
    case 'DUE':
      return 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200';
    case 'FORECAST':
      return 'border-border text-muted-foreground border border-dashed bg-transparent';
    default:
      return 'text-muted-foreground';
  }
}

function PlanGridMonthCell({
  planId,
  cell,
  onOpenPlan,
  onOpenExpense,
}: {
  planId: string;
  cell: ExpensePlanGridCell;
  onOpenPlan: (planId: string) => void;
  onOpenExpense: (expenseId: string) => void;
}) {
  if (cell.kind === 'NA') {
    return <span className="text-muted-foreground">—</span>;
  }

  const label = formatAmount(cell.amount);
  const cls = `inline-block min-w-[2.75rem] rounded px-1.5 py-0.5 text-[10px] font-medium ${cellVisualClasses(cell.kind)}`;

  if (cell.expenseId) {
    return (
      <button
        type="button"
        className={`${cls} hover:opacity-90`}
        onClick={(e) => {
          e.stopPropagation();
          onOpenExpense(cell.expenseId);
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`${cls} hover:opacity-90`}
      onClick={(e) => {
        e.stopPropagation();
        onOpenPlan(planId);
      }}
    >
      {label}
    </button>
  );
}

export function ExpensePlanCoverageGrid({
  year,
  onYearChange,
  payload,
  loading,
  error,
  onRetry,
  onOpenPlan,
  onOpenExpense,
}: ExpensePlanCoverageGridProps) {
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
          <h2 className="text-foreground text-lg font-semibold">Plan calendar</h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            Expected amounts by month; paid / open cards open the expense sheet here, empty
            scheduled cells open the plan.
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
                  Plan
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
                <tr key={row.planId} className="hover:bg-secondary/30">
                  <td
                    className="bg-card sticky left-0 z-10 cursor-pointer px-3 py-2 font-medium"
                    onClick={() => onOpenPlan(row.planId)}
                  >
                    <div>
                      <p>{row.planName}</p>
                      {row.projectLabel ? (
                        <p className="text-muted-foreground text-[10px]">{row.projectLabel}</p>
                      ) : null}
                    </div>
                  </td>
                  {row.months.map((cell, idx) => (
                    <td key={idx} className="px-1 py-2 text-center">
                      <PlanGridMonthCell
                        planId={row.planId}
                        cell={cell}
                        onOpenPlan={onOpenPlan}
                        onOpenExpense={onOpenExpense}
                      />
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
          No expense plans for this year with the current filters.
        </p>
      )}
    </section>
  );
}
