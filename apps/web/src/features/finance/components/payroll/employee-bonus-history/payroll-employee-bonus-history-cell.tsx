'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollAllocationMatrixCellInput } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-cell-input';
import { ExpansionMetricStack } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-metrics';
import { PAYROLL_MATRIX_CELL_CLASS } from '@/features/finance/constants/payroll-allocation-matrix-cell';
import { payrollRunStatusUi } from '@/features/finance/constants/payroll-run-status-ui';
import { matrixCellNeedsManualBonus } from '@/features/finance/utils/payroll-matrix-cell-actions';
import { formatPayrollMonthAbbrev } from '@/features/finance/utils/salary-board-month-utils';
import type {
  PayrollAllocationMatrixCell,
  PayrollMatrixCellState,
} from '@/lib/api/payroll-allocation-matrix';
import type { PayrollEmployeeBonusHistoryProject } from '@/lib/api/payroll-employee-bonus-history';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { cn } from '@/lib/utils';

const CELL_BOX_CLASS = 'flex h-14 w-full items-center justify-center rounded-md border px-1';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: string | null): string {
  if (value == null) return '—';
  const n = parseMoney(value);
  return n > 0 ? formatAmount(n) : '—';
}

/** Calendar coloring mirrors the Employee × Order matrix palette. */
function boxClassForState(state: PayrollMatrixCellState, hasValue: boolean): string {
  if (state === 'UNLINKED') {
    return hasValue
      ? 'border-border bg-muted/25 text-foreground'
      : 'border-border border-dashed bg-muted/15 text-muted-foreground';
  }
  return cn('border-transparent', PAYROLL_MATRIX_CELL_CLASS[state]);
}

function historyCellState(
  isFocusMonth: boolean,
  focusCell: PayrollAllocationMatrixCell | null,
  hasValue: boolean,
): PayrollMatrixCellState {
  if (isFocusMonth && focusCell) return focusCell.state;
  return hasValue ? 'READY' : 'UNLINKED';
}

export function HistoryMonthHeader({
  payrollMonth,
  runStatus,
  isFocusMonth,
  monthBonusTotal,
  historyLoading,
}: {
  payrollMonth: string;
  runStatus: PayrollRunStatus | null;
  isFocusMonth: boolean;
  monthBonusTotal: string;
  historyLoading: boolean;
}) {
  const statusLabel =
    runStatus != null ? payrollRunStatusUi(runStatus).label : isFocusMonth ? 'Current' : null;
  const showTotalSkeleton = historyLoading && !isFocusMonth;

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
      {showTotalSkeleton ? (
        <span className="bg-muted/60 h-3 w-10 animate-pulse rounded" aria-hidden />
      ) : (
        <span className="text-foreground text-[10px] font-bold tabular-nums">
          {fmt(monthBonusTotal)}
        </span>
      )}
    </div>
  );
}

export function HistoryMonthCell({
  amount,
  readOnly,
  editable,
  isFocusMonth,
  focusCell,
  availableFunding,
  saving,
  historyLoading,
  onSave,
  onManualBonus,
}: {
  amount: string | null;
  readOnly: boolean;
  editable: boolean;
  isFocusMonth: boolean;
  focusCell: PayrollAllocationMatrixCell | null;
  availableFunding: number;
  saving: boolean;
  historyLoading: boolean;
  onSave: (payload: { releaseThisMonth: string; reason?: string }) => Promise<void>;
  onManualBonus: () => void;
}) {
  if (historyLoading && !isFocusMonth) {
    return (
      <div
        className="border-border bg-muted/30 flex h-14 w-full items-center justify-center rounded-md border border-dashed"
        aria-hidden
      >
        <span className="bg-muted/50 h-3 w-12 animate-pulse rounded" />
      </div>
    );
  }

  const display = isFocusMonth && focusCell ? focusCell.releaseThisMonth : amount;
  const hasValue = display != null && parseMoney(display) > 0;
  const state = historyCellState(isFocusMonth, focusCell, hasValue);
  const boxClass = cn(CELL_BOX_CLASS, boxClassForState(state, hasValue));

  if (isFocusMonth && focusCell && editable && matrixCellNeedsManualBonus(focusCell, editable)) {
    return (
      <button
        type="button"
        aria-label="Create manual bonus"
        className={cn(boxClass, 'cursor-pointer transition-colors hover:bg-sky-500/10')}
        onClick={onManualBonus}
      />
    );
  }

  if (isFocusMonth && focusCell?.editable && !readOnly) {
    return (
      <div className={boxClass}>
        <PayrollAllocationMatrixCellInput
          cell={focusCell}
          availableFunding={availableFunding}
          disabled={!focusCell.editable}
          saving={saving}
          onSave={onSave}
        />
      </div>
    );
  }

  return (
    <div className={boxClass}>
      <span className="truncate text-xs font-semibold tabular-nums">{fmt(display)}</span>
    </div>
  );
}

export function ProjectDetailMetrics({ project }: { project: PayrollEmployeeBonusHistoryProject }) {
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
