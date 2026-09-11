'use client';

import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';
import {
  formatSalaryCalendarTotalAmount,
  SALARY_CALENDAR_SLOT_CLASS,
  SalaryBoardCalendarEmptyCell,
  SalaryBoardCalendarMonthCell,
  SalaryBoardCalendarMonthHeader,
  SalaryBoardCalendarTotalAmount,
} from '@/features/finance/components/payroll/salary-board-calendar-desktop-cells';
import {
  FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
  FinanceCalendarYearControl,
} from '@/features/finance/components/finance-calendar-year-control';
import {
  FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
  FINANCE_CALENDAR_SCROLL_SHELL_CLASS,
  FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
  FINANCE_CALENDAR_STICKY_SURFACE_CLASS,
} from '@/features/finance/constants/finance-calendar-cell-colors';
import {
  FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET,
  FINANCE_CALENDAR_MOBILE_MIN_YEAR,
} from '@/features/finance/constants/finance-calendar-mobile';
import { formatAmount } from '@/features/finance/constants/finance';
import { financeCalendarTotalColClass } from '@/features/finance/constants/finance-calendar-total-display';
import { useFinanceCalendarPreferFullTotal } from '@/features/finance/hooks/use-finance-calendar-prefer-full-total';
import { useAppSidebarCollapsed } from '@/hooks/use-app-sidebar-collapsed';
import {
  sumSalaryBoardColumn,
  sumSalaryBoardRow,
  sumSalaryBoardRowsTotal,
} from '@/features/finance/utils/salary-board-month-utils';
import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const SALARY_CALENDAR_EMPLOYEE_COL_CLASS = 'w-44 min-w-[11rem]';
const SALARY_CALENDAR_MONTH_COL_CLASS = 'w-[4.5rem]';
const STICKY_SURFACE_CLASS = FINANCE_CALENDAR_STICKY_SURFACE_CLASS;

/** Sticky only on the top header row (months scroll vertically under it). */
const STICKY_EMPLOYEE_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky top-0 z-40 overflow-hidden border-r border-b px-3 py-1.5 text-left text-[10px] font-semibold tracking-wide uppercase',
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

export function SalaryBoardCalendarDesktopGrid({
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
              <div className={FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS}>
                <span className="text-[10px] font-semibold tracking-wide uppercase">Employee</span>
                <FinanceCalendarYearControl
                  year={calendarYear}
                  onYearChange={onCalendarYearChange}
                  minYear={FINANCE_CALENDAR_MOBILE_MIN_YEAR}
                  maxYearOffset={FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET}
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
                    <EmployeePersonAvatar
                      label={employeeDisplayName(row.employee)}
                      imageUrl={row.employee.avatar}
                      className="size-8 text-xs"
                    />
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
          <tr className="font-medium">
            <td
              className={cn(
                FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
                'border-border text-muted-foreground z-50 border-t border-r px-3 py-2 text-xs font-semibold tracking-wide uppercase',
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
                    FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
                    SALARY_CALENDAR_MONTH_COL_CLASS,
                    'border-border z-40 border-t px-1 py-2 text-center',
                  )}
                >
                  {columnTotal > 0 ? (
                    <div
                      className={cn(
                        FINANCE_CALENDAR_MONTH_TOTAL_CARD_CLASS,
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
                FINANCE_CALENDAR_STICKY_FOOTER_CELL_CLASS,
                STICKY_TOTAL_FOOTER_CLASS,
                'z-50 border-t',
                totalColClass,
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
