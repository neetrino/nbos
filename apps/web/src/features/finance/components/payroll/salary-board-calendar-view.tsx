'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AmdCurrencyIcon } from '@/components/shared/AmdCurrencyIcon';
import { formatAmount, formatAmountAbbreviated } from '@/features/finance/constants/finance';
import { payrollRunStatusUi } from '@/features/finance/constants/payroll-run-status-ui';
import {
  salaryLineCalendarCellClass,
  salaryLineStatusBoardUi,
} from '@/features/finance/constants/salary-board-line-status';
import {
  employeeDisplayName,
  employeeInitials,
} from '@/features/finance/components/payroll/salary-board-entries';
import {
  formatPayrollMonthAbbrev,
  parseSalaryBoardAmount,
  sumSalaryBoardColumn,
  sumSalaryBoardRow,
  sumSalaryBoardRowsTotal,
} from '@/features/finance/utils/salary-board-month-utils';
import type {
  SalaryBoardCell,
  SalaryBoardColumn,
  SalaryBoardResponse,
} from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';
import {
  FINANCE_CALENDAR_CELL_EMPTY,
  FINANCE_CALENDAR_SCROLL_SHELL_CLASS,
  FINANCE_CALENDAR_STICKY_SURFACE_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import { financeCalendarTotalColClass } from '@/features/finance/constants/finance-calendar-total-display';
import { useFinanceCalendarPreferFullTotal } from '@/features/finance/hooks/use-finance-calendar-prefer-full-total';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';

const MIN_SALARY_BOARD_YEAR = 2020;
const MAX_SALARY_BOARD_YEAR_OFFSET = 2;
const SALARY_CALENDAR_SLOT_CLASS = 'h-16 w-full';

const SALARY_CALENDAR_EMPLOYEE_COL_CLASS = 'w-44 min-w-[11rem]';
const SALARY_CALENDAR_MONTH_COL_CLASS = 'w-[4.5rem]';
const STICKY_SURFACE_CLASS = FINANCE_CALENDAR_STICKY_SURFACE_CLASS;

/** Sticky only on the top header row (months scroll vertically under it). */
const STICKY_EMPLOYEE_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky top-0 z-40 border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
  STICKY_SURFACE_CLASS,
  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
);

const STICKY_EMPLOYEE_CELL_CLASS = cn(
  'border-border text-foreground border-r border-b px-3 py-2',
  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
);

const STICKY_TOTAL_HEADER_CLASS =
  'border-border text-foreground sticky top-0 z-40 border-l border-b px-1 py-1.5 text-center text-sm font-bold tracking-wide uppercase';

const STICKY_TOTAL_CELL_CLASS =
  'border-border text-foreground border-l border-b p-1 align-middle text-center';

const STICKY_TOTAL_FOOTER_CLASS =
  'border-border text-foreground border-l border-t p-1 align-middle text-center';

const SALARY_CALENDAR_MONTH_HEAD_CLASS = cn(
  'border-border sticky top-0 z-30 border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  STICKY_SURFACE_CLASS,
  SALARY_CALENDAR_MONTH_COL_CLASS,
);

const SALARY_CALENDAR_MONTH_CELL_CLASS = cn(
  'border-border border-b p-1 align-middle',
  SALARY_CALENDAR_MONTH_COL_CLASS,
);

/** `preferFullTotal` → full amount; else compact `2M` / `200K`. */
function formatSalaryCalendarTotalAmount(amount: number, preferFullTotal: boolean): string {
  return preferFullTotal ? formatAmount(amount) : formatAmountAbbreviated(amount);
}

function SalaryBoardCalendarTotalAmount({
  amount,
  preferFullTotal,
  size = 'sm',
}: {
  amount: number;
  preferFullTotal: boolean;
  size?: 'sm' | 'base';
}) {
  const display = formatSalaryCalendarTotalAmount(amount, preferFullTotal);
  const fullAmount = formatAmount(amount);
  const isCompact = !preferFullTotal;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center text-center',
        size === 'sm' && SALARY_CALENDAR_SLOT_CLASS,
      )}
      title={isCompact ? fullAmount : undefined}
    >
      <span
        className={cn(
          'inline-flex max-w-full items-baseline justify-center gap-0.5',
          isCompact && 'truncate',
        )}
      >
        <span
          className={cn(
            'truncate leading-tight font-bold tabular-nums',
            size === 'base' ? 'text-base' : 'text-sm',
          )}
        >
          {display}
        </span>
        {isCompact ? (
          <AmdCurrencyIcon
            className={cn('shrink-0 font-bold opacity-90', size === 'base' ? 'text-sm' : 'text-xs')}
          />
        ) : null}
      </span>
    </div>
  );
}

export function SalaryBoardCalendarView({
  data,
  rows,
  calendarYear,
  onCalendarYearChange,
  onOpenMonth,
}: {
  data: SalaryBoardResponse;
  rows: SalaryBoardResponse['rows'];
  calendarYear: number;
  onCalendarYearChange: (year: number) => void;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const columnCount = data.columns.length;
  const filteredGrandTotal = sumSalaryBoardRowsTotal(rows, columnCount);
  const sidebarCollapsed = useAppSidebarCollapsed();
  const preferFullTotal = useFinanceCalendarPreferFullTotal(sidebarCollapsed);
  const totalColClass = financeCalendarTotalColClass(preferFullTotal);

  return (
    <div
      className={FINANCE_CALENDAR_SCROLL_SHELL_CLASS}
      aria-label={`Salary calendar ${calendarYear}`}
    >
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className={SALARY_CALENDAR_EMPLOYEE_COL_CLASS} />
          {data.columns.map((col) => (
            <col key={col.payrollMonth} className={SALARY_CALENDAR_MONTH_COL_CLASS} />
          ))}
          <col className={totalColClass} />
        </colgroup>
        <thead>
          <tr className={STICKY_SURFACE_CLASS}>
            <th className={cn(STICKY_EMPLOYEE_HEADER_CLASS, 'py-2 normal-case')}>
              <div
                className={cn(
                  'flex w-full gap-1',
                  sidebarCollapsed
                    ? 'flex-row items-center justify-between'
                    : 'flex-col items-start gap-1.5',
                )}
              >
                <span className="text-[10px] font-semibold tracking-wide uppercase">Employee</span>
                <SalaryBoardCalendarYearControl
                  year={calendarYear}
                  onYearChange={onCalendarYearChange}
                />
              </div>
            </th>
            {data.columns.map((col) => (
              <th key={col.payrollMonth} className={SALARY_CALENDAR_MONTH_HEAD_CLASS}>
                <SalaryBoardCalendarMonthHeader column={col} />
              </th>
            ))}
            <th className={cn(STICKY_TOTAL_HEADER_CLASS, STICKY_SURFACE_CLASS, totalColClass)}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowTotal = sumSalaryBoardRow(row, columnCount);
            return (
              <tr key={row.employee.id} className="hover:bg-muted/15">
                <td className={STICKY_EMPLOYEE_CELL_CLASS}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="bg-muted/50 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      aria-hidden
                    >
                      {employeeInitials(row.employee)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {employeeDisplayName(row.employee)}
                      </div>
                      {row.employee.position ? (
                        <div className="text-muted-foreground truncate text-xs">
                          {row.employee.position}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
                {row.cells.map((cell, idx) => {
                  const monthKey = data.months[idx] ?? `col-${idx}`;
                  return (
                    <td key={monthKey} className={SALARY_CALENDAR_MONTH_CELL_CLASS}>
                      {cell ? (
                        <SalaryBoardCalendarMonthCell cell={cell} onOpen={onOpenMonth} />
                      ) : (
                        <SalaryBoardCalendarEmptyCell />
                      )}
                    </td>
                  );
                })}
                <td className={cn(STICKY_TOTAL_CELL_CLASS, totalColClass)}>
                  <SalaryBoardCalendarTotalAmount
                    amount={rowTotal}
                    preferFullTotal={preferFullTotal}
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
                'border-border text-muted-foreground border-t border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
                STICKY_SURFACE_CLASS,
                SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
              )}
            >
              Month total
            </td>
            {data.columns.map((col, idx) => {
              const columnTotal = sumSalaryBoardColumn(rows, idx);
              return (
                <td
                  key={`total-${col.payrollMonth}`}
                  className={cn(
                    'border-border border-t px-1 py-2 text-center',
                    STICKY_SURFACE_CLASS,
                  )}
                >
                  {columnTotal > 0 ? (
                    <div
                      className={cn(
                        'border-border bg-muted/20 flex items-center justify-center truncate rounded-md border px-0.5 text-sm font-bold tabular-nums',
                        SALARY_CALENDAR_SLOT_CLASS,
                      )}
                      title={formatAmount(columnTotal)}
                    >
                      {formatSalaryCalendarTotalAmount(columnTotal, false)}
                    </div>
                  ) : (
                    <SalaryBoardCalendarEmptyCell />
                  )}
                </td>
              );
            })}
            <td
              className={cn(
                STICKY_TOTAL_FOOTER_CLASS,
                STICKY_SURFACE_CLASS,
                totalColClass,
                'border-t',
              )}
            >
              <SalaryBoardCalendarTotalAmount
                amount={filteredGrandTotal}
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

function SalaryBoardCalendarYearControl({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (year: number) => void;
}) {
  const maxYear = new Date().getFullYear() + MAX_SALARY_BOARD_YEAR_OFFSET;

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
        disabled={year <= MIN_SALARY_BOARD_YEAR}
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

function SalaryBoardCalendarEmptyCell() {
  return (
    <div className={cn(FINANCE_CALENDAR_CELL_EMPTY, SALARY_CALENDAR_SLOT_CLASS)} aria-hidden>
      —
    </div>
  );
}

function SalaryBoardCalendarMonthCell({
  cell,
  onOpen,
}: {
  cell: SalaryBoardCell;
  onOpen: (salaryLineId: string) => void;
}) {
  const statusUi = salaryLineStatusBoardUi(cell.lineStatus);
  const payableValue = parseSalaryBoardAmount(cell.totalPayable);
  const payable = formatAmountAbbreviated(payableValue);

  return (
    <button
      type="button"
      onClick={() => onOpen(cell.salaryLineId)}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1.5 text-center transition-colors',
        SALARY_CALENDAR_SLOT_CLASS,
        salaryLineCalendarCellClass(cell.lineStatus),
      )}
      aria-label={`${statusUi.label} · ${formatAmount(payableValue)}`}
    >
      <span className="max-w-full truncate text-[9px] font-semibold tracking-wide uppercase opacity-90">
        {statusUi.label}
      </span>
      <span className="max-w-full truncate text-sm leading-tight font-bold tabular-nums">
        {payable}
      </span>
    </button>
  );
}

function SalaryBoardCalendarMonthHeader({ column }: { column: SalaryBoardColumn }) {
  const label = formatPayrollMonthAbbrev(column.payrollMonth);
  const runUi = column.runStatus ? payrollRunStatusUi(column.runStatus) : null;

  return (
    <div className="flex flex-col items-center gap-1">
      {column.payrollRunId ? (
        <Link
          href={`/finance/payroll/${column.payrollRunId}`}
          className="text-foreground hover:text-primary text-xs font-semibold hover:underline"
        >
          {label}
        </Link>
      ) : (
        <span className="text-muted-foreground text-xs font-semibold">{label}</span>
      )}
      {runUi ? (
        <span className="text-muted-foreground max-w-full truncate text-[8px] leading-tight">
          {runUi.label}
        </span>
      ) : (
        <span className="text-muted-foreground text-[8px]">No run</span>
      )}
    </div>
  );
}
