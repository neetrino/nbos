'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { formatAmount } from '@/features/finance/constants/finance';
import type { ExpensePlanGridPayload } from '@/lib/api/expense-plans';
import { cn } from '@/lib/utils';
import {
  FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
  FINANCE_CALENDAR_SCROLL_SHELL_CLASS,
  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
  FINANCE_CALENDAR_STICKY_SURFACE_CLASS,
  FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import {
  FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET,
  FINANCE_CALENDAR_MOBILE_MIN_YEAR,
  financeCalendarMonthLabels,
} from '@/features/finance/constants/finance-calendar-mobile';
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
import { sortExpensePlanGridRows } from './expense-plan-coverage-cell-visual';
import { ExpensePlanGridRowLabel } from './ExpensePlanGridRowLabel';
import { useExpensePlansT } from './expense-plan-message-keys';
import {
  FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
  FinanceCalendarYearControl,
} from '../finance-calendar-year-control';

const PLAN_LABEL_COL_CLASS = 'w-44 min-w-[11rem]';
const PLAN_MONTH_COL_CLASS = 'w-[4.5rem]';
const STICKY_SURFACE_CLASS = FINANCE_CALENDAR_STICKY_SURFACE_CLASS;
const TOTAL_STICKY_SURFACE_CLASS = FINANCE_CALENDAR_TOTAL_STICKY_SURFACE_CLASS;

const STICKY_PLAN_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky top-0 left-0 z-40 overflow-hidden border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
  STICKY_SURFACE_CLASS,
  PLAN_LABEL_COL_CLASS,
);

const STICKY_PLAN_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-20 cursor-pointer border-r border-b px-3 py-2',
  STICKY_SURFACE_CLASS,
  PLAN_LABEL_COL_CLASS,
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

interface ExpensePlanCoverageDesktopGridProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: ExpensePlanGridPayload;
  onOpenPlan: (planId: string) => void;
  onOpenExpense: (expenseId: string) => void;
}

export function ExpensePlanCoverageDesktopGrid({
  year,
  onYearChange,
  payload,
  onOpenPlan,
  onOpenExpense,
}: ExpensePlanCoverageDesktopGridProps) {
  const t = useExpensePlansT();
  const locale = useLocale();
  const sidebarCollapsed = useAppSidebarCollapsed();
  const preferFullTotal = useFinanceCalendarPreferFullTotal(sidebarCollapsed);
  const totalColClass = financeCalendarTotalColClass(preferFullTotal);
  const months = financeCalendarMonthLabels(year, locale);
  const sortedRows = useMemo(() => sortExpensePlanGridRows(payload.rows), [payload.rows]);

  return (
    <div
      className={FINANCE_CALENDAR_SCROLL_SHELL_CLASS}
      aria-label={t('grid.calendarAria', { year })}
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
              <div className={FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS}>
                <FinanceCalendarYearControl
                  year={year}
                  onYearChange={onYearChange}
                  minYear={FINANCE_CALENDAR_MOBILE_MIN_YEAR}
                  maxYearOffset={FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET}
                />
              </div>
            </th>
            {months.map((month) => (
              <th key={month.key} className={PLAN_MONTH_HEAD_CLASS}>
                <span className="text-muted-foreground text-xs font-semibold">{month.label}</span>
              </th>
            ))}
            <th className={cn(STICKY_TOTAL_HEADER_CLASS, STICKY_SURFACE_CLASS, totalColClass)}>
              {t('grid.total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, rowIndex) => (
            <tr key={row.planId} className="hover:bg-muted/15">
              <td className={STICKY_PLAN_CELL_CLASS} onClick={() => onOpenPlan(row.planId)}>
                <ExpensePlanGridRowLabel
                  rowNumber={rowIndex + 1}
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
          <tr className="font-medium">
            <td
              className={cn(
                FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
                'border-border text-muted-foreground left-0 z-50 border-t border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
                PLAN_LABEL_COL_CLASS,
              )}
            >
              {t('grid.monthTotal')}
            </td>
            {payload.monthTotals.map((total, idx) => (
              <td
                key={idx}
                className={cn(
                  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
                  PLAN_MONTH_COL_CLASS,
                  'border-border z-40 border-t p-1 text-center align-middle',
                )}
              >
                {total > 0 ? (
                  <div
                    className={cn(
                      FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
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
                FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
                STICKY_TOTAL_FOOTER_CLASS,
                'z-50 border-t',
                totalColClass,
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
