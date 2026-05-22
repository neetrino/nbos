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

const PAYROLL_CALENDAR_CELL_MIN_HEIGHT_CLASS = 'min-h-[5.75rem]';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const STICKY_YEAR_CELL_CLASS = cn(
  'border-border text-foreground sticky left-0 z-10 border-r border-b px-3 py-2 text-left font-semibold tabular-nums',
  'bg-background',
);

const STICKY_YEAR_HEADER_CLASS = cn(
  'border-border text-muted-foreground sticky left-0 z-20 border-r border-b px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide',
  'bg-background',
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
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className={STICKY_YEAR_HEADER_CLASS}>Year</th>
            {monthHeaders.map(({ monthNum, label }) => (
              <th
                key={monthNum}
                className="border-border border-b px-2 py-2 text-center text-xs font-semibold"
              >
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
                  <td key={key} className="border-border border-b p-1.5 align-top">
                    {run ? (
                      <PayrollCalendarMonthCell run={run} />
                    ) : (
                      <div
                        className={cn(
                          'text-muted-foreground flex items-center justify-center rounded-lg text-xs',
                          PAYROLL_CALENDAR_CELL_MIN_HEIGHT_CLASS,
                        )}
                      >
                        —
                      </div>
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

function PayrollCalendarMonthCell({ run }: { run: PayrollRunListRow }) {
  const statusUi = payrollRunStatusUi(run.status);
  const payable = formatAmount(parseAmount(run.totalPayable));

  return (
    <Link
      href={`/finance/payroll/${run.id}`}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-center transition-colors',
        PAYROLL_CALENDAR_CELL_MIN_HEIGHT_CLASS,
        payrollRunCalendarCellClass(run.status),
      )}
      aria-label={`${statusUi.label} payroll ${payable}`}
    >
      <span className="text-[10px] font-semibold tracking-wide uppercase opacity-90">
        {statusUi.label}
      </span>
      <span className="text-lg font-bold tabular-nums">{payable}</span>
      <span className="text-[10px] font-medium tabular-nums opacity-80">
        {run._count.salaryLines} lines
      </span>
    </Link>
  );
}
