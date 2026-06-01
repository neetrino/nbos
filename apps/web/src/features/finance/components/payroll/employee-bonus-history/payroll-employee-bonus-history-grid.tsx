'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  HistoryMonthCell,
  HistoryMonthHeader,
  ProjectDetailMetrics,
} from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-cell';
import {
  PAYROLL_EMPLOYEE_HISTORY_DETAIL_COL_CLASS,
  PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_CLASS,
  PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_STYLE,
  PAYROLL_EMPLOYEE_HISTORY_PROJECT_COL_CLASS,
} from '@/features/finance/constants/payroll-employee-bonus-history-layout';
import type { PayrollEmployeeBonusHistory } from '@/lib/api/payroll-employee-bonus-history';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const STICKY_PROJECT_HEADER = cn(
  'border-border bg-card text-muted-foreground sticky left-0 z-30 border-r border-b px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide',
  PAYROLL_EMPLOYEE_HISTORY_PROJECT_COL_CLASS,
);

const STICKY_PROJECT_CELL = cn(
  'border-border bg-card text-foreground sticky left-0 z-20 border-r border-b px-3 py-2',
  PAYROLL_EMPLOYEE_HISTORY_PROJECT_COL_CLASS,
);

const STICKY_DETAIL_HEADER = cn(
  'border-border bg-card text-muted-foreground sticky right-0 z-30 border-l border-b px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wide',
  PAYROLL_EMPLOYEE_HISTORY_DETAIL_COL_CLASS,
);

const STICKY_DETAIL_CELL = cn(
  'border-border bg-card sticky right-0 z-20 border-l border-b px-2 py-2',
  PAYROLL_EMPLOYEE_HISTORY_DETAIL_COL_CLASS,
);

export function PayrollEmployeeBonusHistoryGrid({
  data,
  savingCellKey,
  historyMonthsLoading = false,
  onCellSave,
  onManualBonus,
  scrollToFocusKey,
}: {
  data: PayrollEmployeeBonusHistory;
  savingCellKey: string | null;
  historyMonthsLoading?: boolean;
  onCellSave: (
    cell: PayrollAllocationMatrixCell,
    payload: { releaseThisMonth: string; reason?: string },
  ) => Promise<void>;
  onManualBonus: (cell: PayrollAllocationMatrixCell) => void;
  scrollToFocusKey: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [scrollToFocusKey, data.projects.length]);

  return (
    <div
      ref={scrollRef}
      className="border-border min-h-0 flex-1 overflow-auto overscroll-contain rounded-xl border"
      aria-label="Employee bonus history by project and month"
    >
      <table className="w-max min-w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className={PAYROLL_EMPLOYEE_HISTORY_PROJECT_COL_CLASS} />
          {data.months.map((m) => (
            <col key={m.payrollMonth} className={PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_CLASS} />
          ))}
          <col className={PAYROLL_EMPLOYEE_HISTORY_DETAIL_COL_CLASS} />
        </colgroup>
        <thead>
          <tr className="bg-muted/30">
            <th className={STICKY_PROJECT_HEADER}>Project</th>
            {data.months.map((col) => (
              <th
                key={col.payrollMonth}
                style={PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_STYLE}
                className={cn(
                  'border-border border-b px-0.5 py-0 text-center',
                  PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_CLASS,
                  col.isFocusMonth && 'bg-emerald-50/60 dark:bg-emerald-950/25',
                )}
              >
                {col.payrollRunId && !col.isFocusMonth ? (
                  <Link
                    href={`/finance/payroll/${col.payrollRunId}`}
                    className="hover:underline"
                    title={`Open payroll ${col.payrollMonth}`}
                  >
                    <HistoryMonthHeader
                      payrollMonth={col.payrollMonth}
                      runStatus={col.runStatus}
                      isFocusMonth={col.isFocusMonth}
                      monthBonusTotal={col.monthBonusTotal}
                      historyLoading={historyMonthsLoading}
                    />
                  </Link>
                ) : (
                  <HistoryMonthHeader
                    payrollMonth={col.payrollMonth}
                    runStatus={col.runStatus}
                    isFocusMonth={col.isFocusMonth}
                    monthBonusTotal={col.monthBonusTotal}
                    historyLoading={historyMonthsLoading}
                  />
                )}
              </th>
            ))}
            <th className={STICKY_DETAIL_HEADER}>Pool</th>
          </tr>
        </thead>
        <tbody>
          {data.projects.map((project) => {
            const funding = parseMoney(project.availableFunding);
            const cellKey = project.focusCell
              ? `${project.focusCell.employeeId}:${project.focusCell.orderId}`
              : null;
            return (
              <tr key={project.orderId} className="hover:bg-muted/10">
                <td className={STICKY_PROJECT_CELL}>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{project.label}</div>
                    {project.projectCode ? (
                      <div className="text-muted-foreground truncate text-xs">
                        {project.projectCode}
                      </div>
                    ) : null}
                  </div>
                </td>
                {data.months.map((col, monthIndex) => (
                  <td
                    key={col.payrollMonth}
                    style={PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_STYLE}
                    className={cn(
                      'border-border border-b p-1 align-middle',
                      PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_CLASS,
                    )}
                  >
                    <HistoryMonthCell
                      amount={project.monthAmounts[monthIndex] ?? null}
                      readOnly={col.readOnly}
                      editable={data.editable}
                      isFocusMonth={col.isFocusMonth}
                      focusCell={project.focusCell}
                      availableFunding={funding}
                      saving={cellKey != null && savingCellKey === cellKey}
                      historyLoading={historyMonthsLoading}
                      onSave={(payload) => {
                        if (!project.focusCell) return Promise.resolve();
                        return onCellSave(project.focusCell, payload);
                      }}
                      onManualBonus={() => {
                        if (project.focusCell) onManualBonus(project.focusCell);
                      }}
                    />
                  </td>
                ))}
                <td className={STICKY_DETAIL_CELL}>
                  <ProjectDetailMetrics project={project} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
