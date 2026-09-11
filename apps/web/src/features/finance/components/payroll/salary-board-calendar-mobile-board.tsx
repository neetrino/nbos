'use client';

import { KanbanCardShell, StatusBadge } from '@/components/shared';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { FinanceCalendarMobileEmptyMonthCell } from '@/features/finance/components/finance-calendar-mobile-month-cell';
import { FinanceCalendarMobileMonthCell } from '@/features/finance/components/finance-calendar-mobile-month-cell';
import { FinanceCalendarMobileTotalsGrid } from '@/features/finance/components/finance-calendar-mobile-totals-grid';
import {
  FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
  FinanceCalendarYearControl,
} from '@/features/finance/components/finance-calendar-year-control';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';
import {
  FINANCE_CALENDAR_MOBILE_BOARD_SCROLL_CLASS,
  FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET,
  FINANCE_CALENDAR_MOBILE_MIN_YEAR,
  FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS,
  FINANCE_CALENDAR_MOBILE_YEAR_CONTROL_WIDTH_CLASS,
  financeCalendarCurrentMonthIndex,
} from '@/features/finance/constants/finance-calendar-mobile';
import { formatAmountAbbreviated } from '@/features/finance/constants/finance';
import {
  salaryLineCalendarCellClass,
  salaryLineStatusBoardUi,
} from '@/features/finance/constants/salary-board-line-status';
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

interface SalaryBoardCalendarMobileBoardProps {
  data: SalaryBoardResponse;
  rows: SalaryBoardResponse['rows'];
  calendarYear: number;
  onCalendarYearChange: (year: number) => void;
  onOpenMonth: (salaryLineId: string) => void;
}

export function SalaryBoardCalendarMobileBoard({
  data,
  rows,
  calendarYear,
  onCalendarYearChange,
  onOpenMonth,
}: SalaryBoardCalendarMobileBoardProps) {
  const columnCount = data.columns.length;
  const grandTotal = sumSalaryBoardRowsTotal(rows, columnCount);
  const currentMonthIndex = financeCalendarCurrentMonthIndex(calendarYear);
  const months = data.columns.map((column, index) => ({
    key: index,
    label: formatPayrollMonthAbbrev(column.payrollMonth),
  }));
  const monthTotals = data.columns.map((_, index) => sumSalaryBoardColumn(rows, index));

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      aria-label={`Salary board ${calendarYear}`}
    >
      <div className="flex shrink-0 items-center gap-3">
        <div
          className={cn(
            FINANCE_CALENDAR_LABEL_HEADER_INNER_CLASS,
            FINANCE_CALENDAR_MOBILE_YEAR_CONTROL_WIDTH_CLASS,
          )}
        >
          <FinanceCalendarYearControl
            year={calendarYear}
            onYearChange={onCalendarYearChange}
            minYear={FINANCE_CALENDAR_MOBILE_MIN_YEAR}
            maxYearOffset={FINANCE_CALENDAR_MOBILE_MAX_YEAR_OFFSET}
          />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            {rows.length} employees
          </p>
          <p className="text-foreground truncate text-base font-bold tabular-nums">
            {formatAmountAbbreviated(grandTotal)}
          </p>
        </div>
      </div>
      <div className={FINANCE_CALENDAR_MOBILE_BOARD_SCROLL_CLASS}>
        <section className="border-border bg-card space-y-2 rounded-2xl border p-4">
          <h3 className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
            Month totals
          </h3>
          <FinanceCalendarMobileTotalsGrid
            months={months}
            totals={monthTotals}
            currentMonthIndex={currentMonthIndex}
          />
        </section>
        {rows.map((row) => (
          <SalaryBoardCalendarMobileCard
            key={row.employee.id}
            row={row}
            columns={data.columns}
            currentMonthIndex={currentMonthIndex}
            onOpenMonth={onOpenMonth}
          />
        ))}
      </div>
    </div>
  );
}

function SalaryBoardCalendarMobileCard({
  row,
  columns,
  currentMonthIndex,
  onOpenMonth,
}: {
  row: SalaryBoardResponse['rows'][number];
  columns: SalaryBoardColumn[];
  currentMonthIndex: number | null;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const name = employeeDisplayName(row.employee);
  const rowTotal = sumSalaryBoardRow(row, columns.length);

  return (
    <KanbanCardShell as="article" radius="xl" padding="none" baseShadow="sm" hoverShadow="md">
      <div className="space-y-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <EmployeePersonAvatar
            label={name}
            imageUrl={row.employee.avatar}
            className="size-8 text-xs"
          />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-bold">{name}</p>
            {row.employee.position ? (
              <p className="text-muted-foreground truncate text-xs">{row.employee.position}</p>
            ) : null}
          </div>
          <span className="text-foreground shrink-0 text-sm font-bold tabular-nums">
            {formatAmountAbbreviated(rowTotal)}
          </span>
        </div>
        <div className={FINANCE_CALENDAR_MOBILE_MONTH_GRID_CLASS}>
          {columns.map((column, index) => {
            const cell = row.cells[index] ?? null;
            const caption = formatPayrollMonthAbbrev(column.payrollMonth);
            return (
              <SalaryBoardMobileMonthCell
                key={column.payrollMonth}
                caption={caption}
                cell={cell}
                isCurrentMonth={currentMonthIndex === index}
                onOpenMonth={onOpenMonth}
              />
            );
          })}
        </div>
      </div>
    </KanbanCardShell>
  );
}

function SalaryBoardMobileMonthCell({
  caption,
  cell,
  isCurrentMonth,
  onOpenMonth,
}: {
  caption: string;
  cell: SalaryBoardCell | null;
  isCurrentMonth: boolean;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  if (!cell) {
    return (
      <FinanceCalendarMobileEmptyMonthCell caption={caption} isCurrentMonth={isCurrentMonth} />
    );
  }
  const statusUi = salaryLineStatusBoardUi(cell.lineStatus);
  const amount = formatAmountAbbreviated(parseSalaryBoardAmount(cell.totalPayable));
  return (
    <FinanceCalendarMobileMonthCell
      caption={caption}
      isCurrentMonth={isCurrentMonth}
      visualClassName={salaryLineCalendarCellClass(cell.lineStatus)}
      ariaLabel={[caption, statusUi.label, amount].join(', ')}
      amountOrStatus={amount}
      onOpen={() => onOpenMonth(cell.salaryLineId)}
    />
  );
}
