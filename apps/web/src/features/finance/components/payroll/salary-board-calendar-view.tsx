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
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';

const MIN_SALARY_BOARD_YEAR = 2020;
const MAX_SALARY_BOARD_YEAR_OFFSET = 2;
const SALARY_CALENDAR_SLOT_CLASS = 'h-16 w-full';

const SALARY_CALENDAR_EMPLOYEE_COL_CLASS = 'w-44 min-w-[11rem]';
const SALARY_CALENDAR_MONTH_COL_CLASS = 'w-[4.5rem]';
const SALARY_CALENDAR_TOTAL_COL_CLASS = 'w-[99px] min-w-[99px]';

const STICKY_EMPLOYEE_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky left-0 z-20 border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide',
  'bg-muted/40',
  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
);

const STICKY_EMPLOYEE_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-10 border-r border-b px-3 py-2',
  'bg-muted/40',
  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
);

const STICKY_TOTAL_HEADER_CLASS = cn(
  'border-border text-foreground sticky right-0 z-20 border-l border-b px-1 py-1.5 text-center text-sm font-bold uppercase tracking-wide',
  'bg-muted/40',
  SALARY_CALENDAR_TOTAL_COL_CLASS,
);

const STICKY_TOTAL_CELL_CLASS = cn(
  'border-border text-foreground sticky right-0 z-10 border-l border-b p-1 align-middle text-center',
  'bg-muted/40',
  SALARY_CALENDAR_TOTAL_COL_CLASS,
);

const STICKY_TOTAL_FOOTER_CLASS = cn(
  'border-border text-foreground sticky right-0 z-10 border-l p-1 align-middle text-center',
  'bg-muted/40',
  SALARY_CALENDAR_TOTAL_COL_CLASS,
);

const SALARY_CALENDAR_MONTH_HEAD_CLASS = cn(
  'border-border border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  SALARY_CALENDAR_MONTH_COL_CLASS,
);

const SALARY_CALENDAR_MONTH_CELL_CLASS = cn(
  'border-border border-b p-1 align-middle',
  SALARY_CALENDAR_MONTH_COL_CLASS,
);

/** Sidebar closed → full amount; open → compact `2M` / `200K`. */
function formatSalaryCalendarTotalAmount(amount: number, sidebarCollapsed: boolean): string {
  return sidebarCollapsed ? formatAmount(amount) : formatAmountAbbreviated(amount);
}

function SalaryBoardCalendarTotalAmount({
  amount,
  sidebarCollapsed,
  size = 'sm',
}: {
  amount: number;
  sidebarCollapsed: boolean;
  size?: 'sm' | 'base';
}) {
  const display = formatSalaryCalendarTotalAmount(amount, sidebarCollapsed);
  const fullAmount = formatAmount(amount);
  const isCompact = !sidebarCollapsed;

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

  return (
    <div
      className="border-border min-h-0 flex-1 overflow-x-auto rounded-xl border"
      aria-label={`Salary calendar ${calendarYear}`}
    >
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className={SALARY_CALENDAR_EMPLOYEE_COL_CLASS} />
          {data.columns.map((col) => (
            <col key={col.payrollMonth} className={SALARY_CALENDAR_MONTH_COL_CLASS} />
          ))}
          <col className={SALARY_CALENDAR_TOTAL_COL_CLASS} />
        </colgroup>
        <thead>
          <tr className="bg-muted/40">
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
            <th className={STICKY_TOTAL_HEADER_CLASS}>Total</th>
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
                <td className={STICKY_TOTAL_CELL_CLASS}>
                  <SalaryBoardCalendarTotalAmount
                    amount={rowTotal}
                    sidebarCollapsed={sidebarCollapsed}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 font-medium">
            <td
              className={cn(
                'border-border text-muted-foreground sticky left-0 z-10 border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
                'bg-muted/40',
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
                  className="border-border px-1 py-2 text-center text-sm font-bold tabular-nums"
                  title={sidebarCollapsed ? undefined : formatAmount(columnTotal)}
                >
                  {formatSalaryCalendarTotalAmount(columnTotal, sidebarCollapsed)}
                </td>
              );
            })}
            <td className={STICKY_TOTAL_FOOTER_CLASS}>
              <SalaryBoardCalendarTotalAmount
                amount={filteredGrandTotal}
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
    <div
      className={cn(
        'border-border bg-muted/20 text-muted-foreground flex items-center justify-center rounded-md border border-dashed text-xs',
        SALARY_CALENDAR_SLOT_CLASS,
      )}
      aria-hidden
    >
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
