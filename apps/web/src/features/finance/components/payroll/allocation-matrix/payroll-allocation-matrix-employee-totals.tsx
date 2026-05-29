'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_DATA_COL_STYLE,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
  PAYROLL_MATRIX_STICKY_EDGE_STYLE,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  PAYROLL_MATRIX_TOTALS_COL_STYLE,
  PAYROLL_MATRIX_TOTALS_COL_WIDTH,
  PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import type { PayrollAllocationMatrixEmployee } from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const MATRIX_TOTALS_LABEL_CLASS =
  'text-foreground block w-full text-center text-[10px] font-bold tracking-wide uppercase';

export function MatrixEmployeeTotalsHeader() {
  return (
    <th
      style={PAYROLL_MATRIX_TOTALS_COL_STYLE}
      className={cn(
        PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky top-0 right-0 z-30 border-b border-l px-2 py-1.5 text-center align-middle',
      )}
    >
      <span className={MATRIX_TOTALS_LABEL_CLASS}>Total</span>
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
      style={PAYROLL_MATRIX_TOTALS_COL_STYLE}
      className={cn(
        PAYROLL_MATRIX_TOTALS_STICKY_CLASS,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky right-0 z-10 border-r border-b border-l px-2 py-1.5 text-right align-middle',
      )}
    >
      <span className="text-foreground block min-w-0 truncate text-xs font-semibold tabular-nums">
        {formatAmount(parseMoney(employee.payableTotal))}
      </span>
    </td>
  );
}

export function MatrixEmployeeTotalsSpacerCell() {
  return (
    <td
      style={PAYROLL_MATRIX_TOTALS_COL_STYLE}
      className={cn(
        PAYROLL_MATRIX_TOTALS_COL_WIDTH,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky right-0 z-10 border-r border-b border-l',
      )}
      aria-hidden
    />
  );
}

/** Sticky bottom-left corner for Order × Employees totals row. */
export function MatrixEmployeeTotalsFooterCorner() {
  return (
    <th
      style={PAYROLL_MATRIX_STICKY_EDGE_STYLE}
      className={cn(
        PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
        PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky bottom-0 left-0 z-40 border-t border-r px-2.5 py-1.5 text-center align-middle',
      )}
    >
      <span className={MATRIX_TOTALS_LABEL_CLASS}>Total</span>
    </th>
  );
}

export function MatrixEmployeeTotalsFooterCell({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <td
      style={PAYROLL_MATRIX_DATA_COL_STYLE}
      className={cn(
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        PAYROLL_MATRIX_DATA_COL_WIDTH,
        'border-border sticky bottom-0 z-20 border-t border-r px-2 py-1.5 text-right align-middle',
      )}
    >
      <span className="text-foreground block min-w-0 truncate text-xs font-semibold tabular-nums">
        {formatAmount(parseMoney(employee.payableTotal))}
      </span>
    </td>
  );
}

export function MatrixEmployeeTotalsFooterDetailSpacer() {
  return (
    <td
      style={PAYROLL_MATRIX_DETAIL_COL_STYLE}
      className={cn(
        PAYROLL_MATRIX_DETAIL_COL_WIDTH,
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky bottom-0 z-20 border-t border-r',
      )}
      aria-hidden
    />
  );
}
