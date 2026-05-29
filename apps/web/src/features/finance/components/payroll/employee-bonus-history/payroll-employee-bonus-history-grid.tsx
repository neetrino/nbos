'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollAllocationMatrixCellInput } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-cell-input';
import { ExpansionMetricStack } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-metrics';
import {
  PAYROLL_EMPLOYEE_HISTORY_DETAIL_COL_CLASS,
  PAYROLL_EMPLOYEE_HISTORY_DETAIL_COL_STYLE,
  PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_CLASS,
  PAYROLL_EMPLOYEE_HISTORY_MONTH_COL_STYLE,
  PAYROLL_EMPLOYEE_HISTORY_PROJECT_COL_CLASS,
} from '@/features/finance/constants/payroll-employee-bonus-history-layout';
import { payrollRunStatusUi } from '@/features/finance/constants/payroll-run-status-ui';
import { formatPayrollMonthAbbrev } from '@/features/finance/utils/salary-board-month-utils';
import type {
  PayrollEmployeeBonusHistory,
  PayrollEmployeeBonusHistoryProject,
} from '@/lib/api/payroll-employee-bonus-history';
import type { PayrollAllocationMatrixCell } from '@/lib/api/payroll-allocation-matrix';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: string | null): string {
  if (value == null) return '—';
  const n = parseMoney(value);
  return n > 0 ? formatAmount(n) : '—';
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

function MonthHeader({
  payrollMonth,
  runStatus,
  isFocusMonth,
  monthBonusTotal,
}: {
  payrollMonth: string;
  runStatus: PayrollRunStatus | null;
  isFocusMonth: boolean;
  monthBonusTotal: string;
}) {
  const statusLabel =
    runStatus != null ? payrollRunStatusUi(runStatus).label : isFocusMonth ? 'Current' : null;

  return (
    <div className="flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-0.5 py-1">
      <span
        className={cn(
          'text-[10px] font-semibold tabular-nums',
          isFocusMonth ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
        )}
      >
        {formatPayrollMonthAbbrev(payrollMonth)}
      </span>
      {statusLabel ? (
        <span className="text-muted-foreground max-w-full truncate text-[8px] font-medium uppercase">
          {statusLabel}
        </span>
      ) : null}
      <span className="text-foreground text-[10px] font-bold tabular-nums">
        {fmt(monthBonusTotal)}
      </span>
    </div>
  );
}

function HistoryMonthCell({
  amount,
  readOnly,
  isFocusMonth,
  focusCell,
  availableFunding,
  saving,
  onSave,
}: {
  amount: string | null;
  readOnly: boolean;
  isFocusMonth: boolean;
  focusCell: PayrollAllocationMatrixCell | null;
  availableFunding: number;
  saving: boolean;
  onSave: (payload: { releaseThisMonth: string; reason?: string }) => Promise<void>;
}) {
  if (isFocusMonth && focusCell?.editable && !readOnly) {
    return (
      <PayrollAllocationMatrixCellInput
        cell={focusCell}
        availableFunding={availableFunding}
        disabled={!focusCell.editable}
        saving={saving}
        onSave={onSave}
      />
    );
  }

  const display = isFocusMonth && focusCell ? focusCell.releaseThisMonth : amount;
  const hasValue = display != null && parseMoney(display) > 0;

  return (
    <div
      className={cn(
        'flex h-14 w-full items-center justify-center rounded-md border px-1',
        hasValue
          ? readOnly
            ? 'border-border bg-muted/25 text-foreground'
            : 'border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-100'
          : 'border-border bg-muted/15 text-muted-foreground border-dashed',
      )}
    >
      <span className="truncate text-xs font-semibold tabular-nums">{fmt(display)}</span>
    </div>
  );
}

function ProjectDetailMetrics({ project }: { project: PayrollEmployeeBonusHistoryProject }) {
  return (
    <ExpansionMetricStack
      items={[
        { label: 'Available', value: formatAmount(parseMoney(project.availableFunding)) },
        { label: 'Due', value: formatAmount(parseMoney(project.totalRemainingBonus)) },
        { label: 'Paid', value: formatAmount(parseMoney(project.totalPaidBonus)) },
      ]}
    />
  );
}

export function PayrollEmployeeBonusHistoryGrid({
  data,
  savingCellKey,
  onCellSave,
  scrollToFocusKey,
}: {
  data: PayrollEmployeeBonusHistory;
  savingCellKey: string | null;
  onCellSave: (
    cell: PayrollAllocationMatrixCell,
    payload: { releaseThisMonth: string; reason?: string },
  ) => Promise<void>;
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
                    <MonthHeader
                      payrollMonth={col.payrollMonth}
                      runStatus={col.runStatus}
                      isFocusMonth={col.isFocusMonth}
                      monthBonusTotal={col.monthBonusTotal}
                    />
                  </Link>
                ) : (
                  <MonthHeader
                    payrollMonth={col.payrollMonth}
                    runStatus={col.runStatus}
                    isFocusMonth={col.isFocusMonth}
                    monthBonusTotal={col.monthBonusTotal}
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
                      col.isFocusMonth && 'bg-emerald-50/40 dark:bg-emerald-950/15',
                    )}
                  >
                    <HistoryMonthCell
                      amount={project.monthAmounts[monthIndex] ?? null}
                      readOnly={col.readOnly}
                      isFocusMonth={col.isFocusMonth}
                      focusCell={project.focusCell}
                      availableFunding={funding}
                      saving={cellKey != null && savingCellKey === cellKey}
                      onSave={(payload) => {
                        if (!project.focusCell) return Promise.resolve();
                        return onCellSave(project.focusCell, payload);
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
