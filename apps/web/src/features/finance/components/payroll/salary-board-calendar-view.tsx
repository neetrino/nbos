'use client';

import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  payrollRunCalendarCellClass,
  payrollRunStatusUi,
} from '@/features/finance/constants/payroll-run-status-ui';
import {
  SalaryBoardCalendarEmptyCell,
  SalaryBoardCalendarMonthCell,
} from '@/features/finance/components/payroll/salary-board-calendar-month-cell';
import { SalaryBoardCalendarYearControl } from '@/features/finance/components/payroll/salary-board-calendar-year-control';
import {
  employeeDisplayName,
  employeeInitials,
} from '@/features/finance/components/payroll/salary-board-entries';
import type { SalaryBoardColumn, SalaryBoardResponse } from '@/lib/api/payroll-runs';
import {
  formatPayrollMonthAbbrev,
  sumSalaryBoardColumn,
  sumSalaryBoardRow,
  sumSalaryBoardRowsTotal,
} from '@/features/finance/utils/salary-board-month-utils';
import { cn } from '@/lib/utils';

const SALARY_CALENDAR_EMPLOYEE_COL_CLASS = 'w-44 min-w-[11rem]';
const SALARY_CALENDAR_MONTH_COL_CLASS = 'w-[4.5rem]';
const SALARY_CALENDAR_TOTAL_COL_CLASS = 'w-24 min-w-[6rem]';

const STICKY_EMPLOYEE_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky left-0 z-20 border-r border-b px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide',
  'bg-muted/40',
  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
);

const STICKY_EMPLOYEE_CELL_CLASS = cn(
  'border-border sticky left-0 z-10 border-r border-b px-3 py-2',
  'bg-background',
  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
);

const STICKY_TOTAL_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky right-0 z-20 border-l border-b px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide',
  'bg-muted/40',
  SALARY_CALENDAR_TOTAL_COL_CLASS,
);

const STICKY_TOTAL_CELL_CLASS = cn(
  'border-border text-foreground sticky right-0 z-10 border-l border-b px-3 py-2 text-right text-sm font-semibold tabular-nums',
  'bg-background',
  SALARY_CALENDAR_TOTAL_COL_CLASS,
);

const STICKY_TOTAL_FOOTER_CLASS = cn(
  'border-border text-foreground sticky right-0 z-10 border-l px-3 py-2.5 text-right text-sm font-bold tabular-nums',
  'bg-muted/25',
  SALARY_CALENDAR_TOTAL_COL_CLASS,
);

const SALARY_CALENDAR_MONTH_HEAD_CLASS = cn(
  'border-border border-b px-1 py-2 text-center',
  SALARY_CALENDAR_MONTH_COL_CLASS,
);

const SALARY_CALENDAR_MONTH_CELL_CLASS = cn(
  'border-border border-b p-1 align-middle',
  SALARY_CALENDAR_MONTH_COL_CLASS,
);

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

  return (
    <section
      className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
      aria-label={`Salary calendar ${calendarYear}`}
    >
      <header className="border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Salary calendar</h2>
          <p className="text-muted-foreground text-xs">Team payouts · {calendarYear}</p>
        </div>
        <SalaryBoardCalendarYearControl year={calendarYear} onYearChange={onCalendarYearChange} />
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto">
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
              <th className={STICKY_EMPLOYEE_HEADER_CLASS}>Employee</th>
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
                <tr key={row.employee.id} className="group">
                  <td className={STICKY_EMPLOYEE_CELL_CLASS}>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
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
                  <td className={STICKY_TOTAL_CELL_CLASS}>{formatAmount(rowTotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-border bg-muted/25 border-t-2 font-medium">
              <td
                className={cn(
                  'border-border text-muted-foreground sticky left-0 z-10 border-r px-3 py-2.5 text-xs font-semibold tracking-wide uppercase',
                  'bg-muted/25',
                  SALARY_CALENDAR_EMPLOYEE_COL_CLASS,
                )}
              >
                Month total
              </td>
              {data.columns.map((col, idx) => (
                <td
                  key={`total-${col.payrollMonth}`}
                  className="border-border px-1 py-2 text-center text-sm font-bold tabular-nums"
                >
                  {formatAmount(sumSalaryBoardColumn(rows, idx))}
                </td>
              ))}
              <td className={STICKY_TOTAL_FOOTER_CLASS}>{formatAmount(filteredGrandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
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
      {runUi && column.runStatus ? (
        <span
          className={cn(
            'max-w-full truncate rounded-md border px-1 py-0 text-[8px] leading-tight font-semibold',
            payrollRunCalendarCellClass(column.runStatus),
          )}
        >
          {runUi.label}
        </span>
      ) : (
        <span className="text-muted-foreground text-[8px]">No run</span>
      )}
    </div>
  );
}
