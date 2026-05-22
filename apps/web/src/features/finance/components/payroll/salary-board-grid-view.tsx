'use client';

import Link from 'next/link';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';
import { SalaryBoardCellButton } from '@/features/finance/components/payroll/salary-board-cell-button';
import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

export function SalaryBoardGridView({
  data,
  rows,
  onOpenMonth,
}: {
  data: SalaryBoardResponse;
  rows: SalaryBoardResponse['rows'];
  onOpenMonth: (salaryLineId: string) => void;
}) {
  return (
    <div className="border-border overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th
              className={cn(
                'border-border text-foreground sticky left-0 z-20 border-r border-b px-3 py-2 text-left font-semibold',
                'bg-background',
              )}
            >
              Employee
            </th>
            {data.columns.map((col) => (
              <th
                key={col.payrollMonth}
                className="border-border border-b px-2 py-2 text-center font-semibold"
              >
                <div className="flex flex-col items-center gap-1">
                  {col.payrollRunId ? (
                    <Link
                      href={`/finance/payroll/${col.payrollRunId}`}
                      className="text-primary hover:underline"
                    >
                      {col.payrollMonth}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{col.payrollMonth}</span>
                  )}
                  {col.runStatus ? (
                    <span className="text-muted-foreground text-xs font-normal">
                      {PAYROLL_RUN_STATUS_LABEL[col.runStatus]}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs font-normal">No run</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employee.id} className="hover:bg-muted/20">
              <td
                className={cn(
                  'border-border text-foreground sticky left-0 z-10 border-r border-b px-3 py-2',
                  'bg-background',
                )}
              >
                <div className="font-medium">{employeeDisplayName(row.employee)}</div>
                {row.employee.position ? (
                  <div className="text-muted-foreground text-xs">{row.employee.position}</div>
                ) : null}
              </td>
              {row.cells.map((cell, idx) => {
                const monthKey = data.months[idx] ?? `col-${idx}`;
                return (
                  <td key={monthKey} className="border-border border-b px-1 py-1 align-top">
                    {cell ? (
                      <SalaryBoardCellButton cell={cell} onOpen={onOpenMonth} compact />
                    ) : (
                      <div className="text-muted-foreground flex min-h-[3rem] items-center justify-center text-xs">
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
