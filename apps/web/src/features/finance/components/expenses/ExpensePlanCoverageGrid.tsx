'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import type { ExpensePlanGridPayload } from '@/lib/api/expense-plans';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FINANCE_CALENDAR_SCROLL_SHELL_CLASS,
  FINANCE_CALENDAR_STICKY_SURFACE_CLASS,
  FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import { financeCalendarTotalColClass } from '@/features/finance/constants/finance-calendar-total-display';
import { useFinanceCalendarPreferFullTotal } from '@/features/finance/hooks/use-finance-calendar-prefer-full-total';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import {
  EXPENSE_PLAN_CALENDAR_SLOT_CLASS,
  ExpensePlanCompactAmount,
  ExpensePlanEmptyMonthCell,
  ExpensePlanGridMonthCell,
  formatExpensePlanGridAmount,
} from './expense-plan-coverage-grid-cells';
import { ExpensePlanGridRowLabel } from './ExpensePlanGridRowLabel';

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

const MIN_PLAN_BOARD_YEAR = 2020;
const MAX_PLAN_BOARD_YEAR_OFFSET = 2;

const PLAN_LABEL_COL_CLASS = 'w-44 min-w-[11rem]';
const PLAN_MONTH_COL_CLASS = 'w-[4.5rem]';
const STICKY_SURFACE_CLASS = FINANCE_CALENDAR_STICKY_SURFACE_CLASS;
const TOTAL_STICKY_SURFACE_CLASS = FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS;

const STICKY_PLAN_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky top-0 left-0 z-40 border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
  STICKY_SURFACE_CLASS,
  PLAN_LABEL_COL_CLASS,
);

const STICKY_PLAN_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-20 border-r border-b px-3 py-2',
  STICKY_SURFACE_CLASS,
  PLAN_LABEL_COL_CLASS,
  'cursor-pointer',
);

const STICKY_TOTAL_HEADER_CLASS =
  'border-border text-foreground sticky top-0 right-0 z-40 border-l border-b px-1 py-1.5 text-center text-sm font-bold tracking-wide uppercase';

const STICKY_TOTAL_CELL_CLASS =
  'border-border text-foreground sticky right-0 z-20 border-l border-b p-1 align-middle text-center';

const STICKY_TOTAL_FOOTER_CLASS =
  'border-border text-foreground sticky right-0 z-30 border-l p-1 align-middle text-center';

const PLAN_MONTH_HEAD_CLASS = cn(
  'border-border sticky top-0 z-30 border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  STICKY_SURFACE_CLASS,
  PLAN_MONTH_COL_CLASS,
);

const PLAN_MONTH_CELL_CLASS = cn('border-border border-b p-1 align-middle', PLAN_MONTH_COL_CLASS);

function monthLabelsForYear(year: number): { key: number; label: string }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1);
    return {
      key: index,
      label: date.toLocaleString('en-US', { month: 'short' }),
    };
  });
}

function PlanCalendarYearControl({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (year: number) => void;
}) {
  const maxYear = new Date().getFullYear() + MAX_PLAN_BOARD_YEAR_OFFSET;

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
        disabled={year <= MIN_PLAN_BOARD_YEAR}
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
  const sidebarCollapsed = useAppSidebarCollapsed();
  const preferFullTotal = useFinanceCalendarPreferFullTotal(sidebarCollapsed);
  const totalColClass = financeCalendarTotalColClass(preferFullTotal);
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
        No expense plans for this year with the current filters.
      </p>
    );
  }

  return (
    <div
      className={FINANCE_CALENDAR_SCROLL_SHELL_CLASS}
      aria-label={`Expense plan calendar ${year}`}
    >
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className={PLAN_LABEL_COL_CLASS} />
          {months.map((month) => (
            <col key={month.key} className={PLAN_MONTH_COL_CLASS} />
          ))}
          <col className={totalColClass} />
        </colgroup>
        <thead>
          <tr className={STICKY_SURFACE_CLASS}>
            <th className={cn(STICKY_PLAN_HEADER_CLASS, 'py-2 normal-case')}>
              <div
                className={cn(
                  'flex w-full gap-1',
                  sidebarCollapsed
                    ? 'flex-row items-center justify-between'
                    : 'flex-col items-start gap-1.5',
                )}
              >
                <span className="text-[10px] font-semibold tracking-wide uppercase">Plan</span>
                <PlanCalendarYearControl year={year} onYearChange={onYearChange} />
              </div>
            </th>
            {months.map((month) => (
              <th key={month.key} className={PLAN_MONTH_HEAD_CLASS}>
                <span className="text-muted-foreground text-xs font-semibold">{month.label}</span>
              </th>
            ))}
            <th className={cn(STICKY_TOTAL_HEADER_CLASS, STICKY_SURFACE_CLASS, totalColClass)}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {payload.rows.map((row) => (
            <tr key={row.planId} className="hover:bg-muted/15">
              <td className={STICKY_PLAN_CELL_CLASS} onClick={() => onOpenPlan(row.planId)}>
                <ExpensePlanGridRowLabel
                  planName={row.planName}
                  frequency={row.frequency}
                  projectLabel={row.projectLabel}
                />
              </td>
              {row.months.map((cell, idx) => (
                <td key={idx} className={PLAN_MONTH_CELL_CLASS}>
                  <ExpensePlanGridMonthCell
                    cell={cell}
                    onOpen={() => {
                      if (cell.expenseId) {
                        onOpenExpense(cell.expenseId);
                        return;
                      }
                      onOpenPlan(row.planId);
                    }}
                  />
                </td>
              ))}
              <td
                className={cn(STICKY_TOTAL_CELL_CLASS, TOTAL_STICKY_SURFACE_CLASS, totalColClass)}
              >
                <ExpensePlanCompactAmount
                  value={row.annualTotal}
                  preferFullTotal={preferFullTotal}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={cn(STICKY_SURFACE_CLASS, 'font-medium')}>
            <td
              className={cn(
                'border-border text-muted-foreground sticky left-0 z-20 border-t border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
                STICKY_SURFACE_CLASS,
                PLAN_LABEL_COL_CLASS,
              )}
            >
              Month total
            </td>
            {payload.monthTotals.map((total, idx) => (
              <td key={idx} className={cn(PLAN_MONTH_CELL_CLASS, 'border-t', STICKY_SURFACE_CLASS)}>
                {total > 0 ? (
                  <div
                    className={cn(
                      'border-border bg-muted/20 flex items-center justify-center truncate rounded-md border px-0.5 text-sm font-bold tabular-nums',
                      EXPENSE_PLAN_CALENDAR_SLOT_CLASS,
                    )}
                    title={formatAmount(total)}
                  >
                    {formatExpensePlanGridAmount(total, false)}
                  </div>
                ) : (
                  <ExpensePlanEmptyMonthCell />
                )}
              </td>
            ))}
            <td
              className={cn(
                STICKY_TOTAL_FOOTER_CLASS,
                STICKY_SURFACE_CLASS,
                totalColClass,
                'border-t',
              )}
            >
              <ExpensePlanCompactAmount
                value={payload.grandAnnualTotal}
                preferFullTotal={preferFullTotal}
                size="base"
              />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
