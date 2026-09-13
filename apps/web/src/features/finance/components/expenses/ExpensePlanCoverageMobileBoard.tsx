'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { KanbanCardShell } from '@/components/shared';
import { FinanceCalendarMobileEmptyMonthCell } from '@/features/finance/components/finance-calendar-mobile-month-cell';
import { FinanceCalendarMobileMonthCell } from '@/features/finance/components/finance-calendar-mobile-month-cell';
import { FinanceCalendarMobileTotalsGrid } from '@/features/finance/components/finance-calendar-mobile-totals-grid';
import {
  FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
  FinanceCalendarYearControl,
} from '@/features/finance/components/finance-calendar-year-control';
import {
  FINANCE_CALENDAR_MOBILE_BOARD_SCROLL_CLASS,
  FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET,
  FINANCE_CALENDAR_MOBILE_MIN_YEAR,
  FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS,
  FINANCE_CALENDAR_MOBILE_YEAR_CONTROL_WIDTH_CLASS,
  financeCalendarCurrentMonthIndex,
  financeCalendarMonthLabels,
} from '@/features/finance/constants/finance-calendar-mobile';
import { formatAmountAbbreviated } from '@/features/finance/constants/finance';
import { formatExpensePlanGridRowSubtitle } from '@/features/finance/utils/expense-plan-display';
import type {
  ExpensePlanGridCell,
  ExpensePlanGridPayload,
  ExpensePlanGridRow,
} from '@/lib/api/expense-plans';
import { cn } from '@/lib/utils';
import {
  expensePlanMonthCellVisualClass,
  sortExpensePlanGridRows,
} from './expense-plan-coverage-cell-visual';
import {
  translateExpensePlanCellStatus,
  translateExpensePlanFrequency,
  useExpensePlansT,
} from './expense-plan-message-keys';

interface ExpensePlanCoverageMobileBoardProps {
  year: number;
  onYearChange: (year: number) => void;
  payload: ExpensePlanGridPayload;
  onOpenPlan: (planId: string) => void;
  onOpenExpense: (expenseId: string) => void;
}

export function ExpensePlanCoverageMobileBoard({
  year,
  onYearChange,
  payload,
  onOpenPlan,
  onOpenExpense,
}: ExpensePlanCoverageMobileBoardProps) {
  const t = useExpensePlansT();
  const locale = useLocale();
  const months = financeCalendarMonthLabels(year, locale);
  const currentMonthIndex = financeCalendarCurrentMonthIndex(year);
  const sortedRows = useMemo(() => sortExpensePlanGridRows(payload.rows), [payload.rows]);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      aria-label={t('grid.boardAria', { year })}
    >
      <div className="flex shrink-0 items-center gap-3">
        <div
          className={cn(
            FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
            FINANCE_CALENDAR_MOBILE_YEAR_CONTROL_WIDTH_CLASS,
          )}
        >
          <FinanceCalendarYearControl
            year={year}
            onYearChange={onYearChange}
            minYear={FINANCE_CALENDAR_MOBILE_MIN_YEAR}
            maxYearOffset={FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET}
          />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            {t('grid.planCount', { count: sortedRows.length })}
          </p>
          <p className="text-foreground truncate text-base font-bold tabular-nums">
            {formatAmountAbbreviated(payload.grandAnnualTotal)}
          </p>
        </div>
      </div>
      <div className={FINANCE_CALENDAR_MOBILE_BOARD_SCROLL_CLASS}>
        <section className="border-border bg-card space-y-2 rounded-2xl border p-4">
          <h3 className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            {t('grid.monthTotals')}
          </h3>
          <FinanceCalendarMobileTotalsGrid
            months={months}
            totals={payload.monthTotals}
            currentMonthIndex={currentMonthIndex}
          />
        </section>
        {sortedRows.map((row, index) => (
          <ExpensePlanCoverageMobileCard
            key={row.planId}
            row={row}
            rowNumber={index + 1}
            months={months}
            currentMonthIndex={currentMonthIndex}
            onOpenPlan={onOpenPlan}
            onOpenExpense={onOpenExpense}
          />
        ))}
      </div>
    </div>
  );
}

function ExpensePlanCoverageMobileCard({
  row,
  rowNumber,
  months,
  currentMonthIndex,
  onOpenPlan,
  onOpenExpense,
}: {
  row: ExpensePlanGridRow;
  rowNumber: number;
  months: ReturnType<typeof financeCalendarMonthLabels>;
  currentMonthIndex: number | null;
  onOpenPlan: (planId: string) => void;
  onOpenExpense: (expenseId: string) => void;
}) {
  const t = useExpensePlansT();
  const locale = useLocale();
  const subtitle = formatExpensePlanGridRowSubtitle({
    frequency: row.frequency,
    frequencyLabel: translateExpensePlanFrequency(t, row.frequency),
    projectLabel: row.projectLabel,
    locale,
  });

  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div className="space-y-3 p-4">
        <button
          type="button"
          className="flex w-full min-w-0 items-start justify-between gap-3 text-left"
          onClick={() => onOpenPlan(row.planId)}
        >
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-bold">
              <span className="text-muted-foreground mr-1.5 tabular-nums">{rowNumber}.</span>
              {row.planName}
            </p>
            {subtitle.text ? (
              <p className="text-muted-foreground mt-0.5 truncate text-xs" title={subtitle.title}>
                {subtitle.text}
              </p>
            ) : null}
          </div>
          <span className="text-foreground shrink-0 text-sm font-bold tabular-nums">
            {formatAmountAbbreviated(row.annualTotal)}
          </span>
        </button>
        <div className={FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS}>
          {months.map((month) => {
            const cell = row.months[month.key];
            if (!cell) return null;
            return (
              <ExpensePlanMobileMonthCell
                key={month.key}
                caption={month.label}
                cell={cell}
                isCurrentMonth={currentMonthIndex === month.key}
                onOpen={() => {
                  if (cell.expenseId) {
                    onOpenExpense(cell.expenseId);
                    return;
                  }
                  onOpenPlan(row.planId);
                }}
              />
            );
          })}
        </div>
      </div>
    </KanbanCardShell>
  );
}

function ExpensePlanMobileMonthCell({
  caption,
  cell,
  isCurrentMonth,
  onOpen,
}: {
  caption: string;
  cell: ExpensePlanGridCell;
  isCurrentMonth: boolean;
  onOpen: () => void;
}) {
  if (cell.kind === 'NA') {
    return (
      <FinanceCalendarMobileEmptyMonthCell caption={caption} isCurrentMonth={isCurrentMonth} />
    );
  }
  const t = useExpensePlansT();
  const statusLabel = translateExpensePlanCellStatus(t, cell.kind);
  const amountLabel = formatAmountAbbreviated(cell.amount);
  return (
    <FinanceCalendarMobileMonthCell
      caption={caption}
      isCurrentMonth={isCurrentMonth}
      visualClassName={expensePlanMonthCellVisualClass(cell.kind)}
      ariaLabel={[caption, statusLabel, amountLabel].filter(Boolean).join(', ')}
      amountOrStatus={amountLabel}
      onOpen={onOpen}
    />
  );
}
