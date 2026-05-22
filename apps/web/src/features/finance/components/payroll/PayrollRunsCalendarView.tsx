'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollRunStatusBadge } from '@/features/finance/components/payroll/payroll-run-status-badge';
import {
  buildPayrollRunsCalendarModel,
  PAYROLL_CALENDAR_MONTH_NUMBERS,
  payrollMonthKey,
} from '@/features/finance/utils/payroll-runs-calendar-utils';
import { formatPayrollMonthShort } from '@/features/finance/utils/salary-board-month-utils';
import type { PayrollRunListRow } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

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
                  <td key={key} className="border-border border-b px-1 py-1 align-top">
                    {run ? (
                      <Link
                        href={`/finance/payroll/${run.id}`}
                        className="hover:bg-muted/50 border-border bg-card flex min-h-[4.5rem] flex-col gap-1 rounded-lg border p-2 transition-colors"
                      >
                        <PayrollRunStatusBadge status={run.status} />
                        <span className="text-foreground text-xs font-semibold tabular-nums">
                          {formatAmount(parseAmount(run.totalPayable))}
                        </span>
                        <span className="text-muted-foreground text-[10px] tabular-nums">
                          {run._count.salaryLines} lines
                        </span>
                      </Link>
                    ) : (
                      <div className="text-muted-foreground flex min-h-[4.5rem] items-center justify-center text-xs">
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
