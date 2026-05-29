'use client';

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

export function MatrixEmployeeTotalsHeader() {
  return (
    <th
      className={cn(
        PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky top-0 right-0 z-30 border-b border-l px-2 py-1.5 text-right align-bottom',
      )}
    >
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">Total</p>
    </th>
  );
}

export function MatrixEmployeeTotalsCell({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <td
      className={cn(
        PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky right-0 z-10 border-r border-b border-l px-2 py-1.5 text-right align-middle',
      )}
    >
      <span className="text-foreground text-xs font-semibold tabular-nums">
        {formatAmount(parseMoney(employee.payableTotal))}
      </span>
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
