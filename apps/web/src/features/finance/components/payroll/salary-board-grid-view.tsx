'use client';

import Link from 'next/link';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import { employeeDisplayName } from '@/features/finance/components/payroll/salary-board-entries';
import { SalaryBoardCellButton } from '@/features/finance/components/payroll/salary-board-cell-button';
import { SalaryBoardGridYearControl } from '@/features/finance/components/payroll/salary-board-grid-year-control';
import type { SalaryBoardResponse } from '@/lib/api/payroll-runs';
import {
  formatPayrollMonthShort,
  sumSalaryBoardColumn,
  sumSalaryBoardRow,
  sumSalaryBoardRowsTotal,
} from '@/features/finance/utils/salary-board-month-utils';
import { cn } from '@/lib/utils';

const STICKY_ROW_TOTAL_HEADER_CLASS = cn(
  'border-border text-foreground sticky right-0 z-20 border-l border-b px-3 py-2 text-right font-semibold',
  'bg-background',
);

const STICKY_ROW_TOTAL_CELL_CLASS = cn(
  'border-border text-foreground sticky right-0 z-10 border-l border-b px-3 py-2 text-right tabular-nums',
  'bg-background',
);

const STICKY_ROW_TOTAL_FOOTER_CLASS = cn(
  'border-border text-foreground sticky right-0 z-10 border-l px-3 py-2 text-right font-semibold tabular-nums',
  'bg-muted/30',
);

export function SalaryBoardGridView({
  data,
  rows,
  gridYear,
  onGridYearChange,
  onOpenMonth,
}: {
  data: SalaryBoardResponse;
  rows: SalaryBoardResponse['rows'];
  gridYear: number;
  onGridYearChange: (year: number) => void;
  onOpenMonth: (salaryLineId: string) => void;
}) {
  const columnCount = data.columns.length;
  const filteredGrandTotal = sumSalaryBoardRowsTotal(rows, columnCount);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <SalaryBoardGridYearControl year={gridYear} onYearChange={onGridYearChange} />

      <div className="border-border min-h-0 flex-1 overflow-x-auto rounded-xl border">
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
                        {formatPayrollMonthShort(col.payrollMonth)}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatPayrollMonthShort(col.payrollMonth)}
                      </span>
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
              <th className={STICKY_ROW_TOTAL_HEADER_CLASS}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowTotal = sumSalaryBoardRow(row, columnCount);
              return (
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
                  <td className={STICKY_ROW_TOTAL_CELL_CLASS}>
                    <span className="text-sm font-semibold">{formatAmount(rowTotal)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30 font-medium">
              <td
                className={cn(
                  'border-border text-muted-foreground sticky left-0 z-10 border-r px-3 py-2 text-xs',
                  'bg-muted/30',
                )}
              >
                Month total
              </td>
              {data.columns.map((col, idx) => (
                <td
                  key={`total-${col.payrollMonth}`}
                  className="border-border px-2 py-2 text-center tabular-nums"
                >
                  {formatAmount(sumSalaryBoardColumn(rows, idx))}
                </td>
              ))}
              <td className={STICKY_ROW_TOTAL_FOOTER_CLASS}>{formatAmount(filteredGrandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
