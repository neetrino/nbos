'use client';

import { PanelRightOpen } from 'lucide-react';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  PAYROLL_MATRIX_TOTALS_COL_WIDTH,
  PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import type { PayrollAllocationMatrixEmployee } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const LABEL_CLASS = 'text-muted-foreground text-[10px] leading-tight';
const VALUE_CLASS = 'text-foreground text-right text-[10px] tabular-nums leading-tight';

function AmountLine({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      <span className={cn(VALUE_CLASS, emphasis && 'text-xs font-semibold')}>{value}</span>
    </div>
  );
}

export function MatrixEmployeeTotalsHeader() {
  return (
    <th
      className={cn(
        PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky top-0 right-0 z-30 border-b border-l px-2 py-2 text-left align-bottom',
      )}
    >
      <p className="text-foreground text-xs font-semibold tracking-tight">Total</p>
      <p className="text-muted-foreground text-[10px] leading-tight">Salary + bonus</p>
    </th>
  );
}

export function MatrixEmployeeTotalsCell({
  employee,
  onOpenSalaryLine,
}: {
  employee: PayrollAllocationMatrixEmployee;
  onOpenSalaryLine?: (salaryLineId: string) => void;
}) {
  const salaryLineId = employee.salaryLineId;

  return (
    <td
      className={cn(
        PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky right-0 z-10 border-r border-b border-l px-2 py-2 align-middle',
      )}
    >
      <div className="flex flex-col gap-1">
        <AmountLine label="Salary" value={formatAmount(parseMoney(employee.baseSalary))} />
        <AmountLine label="Bonus" value={formatAmount(parseMoney(employee.bonusTotalThisRun))} />
        <AmountLine
          label="Total"
          value={formatAmount(parseMoney(employee.payableTotal))}
          emphasis
        />
        {onOpenSalaryLine && salaryLineId ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-primary mt-1 inline-flex items-center gap-1 text-[10px] font-medium transition-colors"
            aria-label={`Open salary detail for ${employee.firstName} ${employee.lastName}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenSalaryLine(salaryLineId);
            }}
          >
            <PanelRightOpen className="size-3 shrink-0" aria-hidden />
            Detail
          </button>
        ) : null}
      </div>
    </td>
  );
}

export function MatrixEmployeeTotalsSpacerCell() {
  return (
    <td
      className={cn(
        PAYROLL_MATRIX_TOTALS_COL_WIDTH,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky right-0 z-10 border-r border-b border-l',
      )}
      aria-hidden
    />
  );
}
