'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  payrollRunCalendarCellClass,
  payrollRunStatusUi,
} from '@/features/finance/constants/payroll-run-status-ui';
import {
  buildPayrollRunsCalendarModel,
  PAYROLL_CALENDAR_MONTH_NUMBERS,
  payrollMonthKey,
} from '@/features/finance/utils/payroll-runs-calendar-utils';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const PAYROLL_CALENDAR_YEAR_COL_WIDTH_CLASS = 'w-14';
const PAYROLL_CALENDAR_MONTH_COL_WIDTH_CLASS = 'w-[4.5rem]';
const PAYROLL_CALENDAR_SLOT_CLASS = 'h-16 w-full';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const STICKY_YEAR_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-10 border-r border-b px-2 py-2 text-left text-sm font-semibold tabular-nums',
  'bg-background',
  PAYROLL_CALENDAR_YEAR_COL_WIDTH_CLASS,
);

const STICKY_YEAR_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky left-0 z-20 border-r border-b px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide',
  'bg-background',
  PAYROLL_CALENDAR_YEAR_COL_WIDTH_CLASS,
);

const PAYROLL_CALENDAR_MONTH_HEAD_CLASS = cn(
  'border-border border-b px-1 py-1.5 text-center text-[10px] font-semibold leading-tight',
  PAYROLL_CALENDAR_MONTH_COL_WIDTH_CLASS,
);

const PAYROLL_CALENDAR_MONTH_CELL_CLASS = cn(
  'border-border border-b p-1 align-middle',
  PAYROLL_CALENDAR_MONTH_COL_WIDTH_CLASS,
);

export function PayrollRunsCalendarView({ items }: { items: PayrollRunListRow[] }) {
  const { years, runsByMonthKey } = useMemo(() => buildPayrollRunsCalendarModel(items), [items]);

  const monthHeaders = useMemo(
    () =>
      PAYROLL_CALENDAR_MONTH_NUMBERS.map((monthNum) => ({
        monthNum,
        label: formatPayrollMonthShort(payrollMonthKey(2000, monthNum)),
      })),
    [],
  );

  return (
    <div className="border-border min-h-0 flex-1 overflow-x-auto rounded-xl border">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className={PAYROLL_CALENDAR_YEAR_COL_WIDTH_CLASS} />
          {PAYROLL_CALENDAR_MONTH_NUMBERS.map((monthNum) => (
            <col key={monthNum} className={PAYROLL_CALENDAR_MONTH_COL_WIDTH_CLASS} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-muted/40">
            <th className={STICKY_YEAR_HEADER_CLASS}>Year</th>
            {monthHeaders.map(({ monthNum, label }) => (
              <th key={monthNum} className={PAYROLL_CALENDAR_MONTH_HEAD_CLASS}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year} className="hover:bg-muted/15">
              <td className={STICKY_YEAR_CELL_CLASS}>{year}</td>
              {PAYROLL_CALENDAR_MONTH_NUMBERS.map((monthNum) => {
                const key = payrollMonthKey(year, monthNum);
                const run = runsByMonthKey.get(key);
                return (
                  <td key={key} className={PAYROLL_CALENDAR_MONTH_CELL_CLASS}>
                    {run ? (
                      <PayrollCalendarMonthCell run={run} />
                    ) : (
                      <PayrollCalendarEmptyMonthCell />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayrollCalendarEmptyMonthCell() {
  return (
    <div
      className={cn(
        'border-border bg-muted/20 text-muted-foreground flex items-center justify-center rounded-md border border-dashed text-xs',
        PAYROLL_CALENDAR_SLOT_CLASS,
      )}
      aria-hidden
    >
      —
    </div>
  );
}

function PayrollCalendarMonthCell({ run }: { run: PayrollRunListRow }) {
  const statusUi = payrollRunStatusUi(run.status);
  const payable = formatAmount(parseAmount(run.totalPayable));

  return (
    <Link
      href={`/finance/payroll/${run.id}`}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md border px-1 py-1.5 text-center transition-colors',
        PAYROLL_CALENDAR_SLOT_CLASS,
        payrollRunCalendarCellClass(run.status),
      )}
      aria-label={`${statusUi.label} payroll ${payable}`}
    >
      <span className="max-w-full truncate text-[9px] font-semibold tracking-wide uppercase opacity-90">
        {statusUi.label}
      </span>
      <span className="max-w-full truncate text-sm leading-tight font-bold tabular-nums">
        {payable}
      </span>
    </Link>
  );
}
