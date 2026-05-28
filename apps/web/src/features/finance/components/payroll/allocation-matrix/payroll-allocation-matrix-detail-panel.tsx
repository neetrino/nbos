'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_EXPANSION_CELL_CLASS,
  PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS,
  PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-expansion';
import {
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import type {
  DeliveryPayableUnit,
  PayrollAllocationMatrixCell,
  PayrollAllocationMatrixEmployee,
} from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

type MetricItem = { label: string; value: string };

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: string): string {
  return formatAmount(parseMoney(value));
}

const EXPANSION_METRIC_LABEL_CLASS = 'text-left text-[8px] font-bold tracking-wide leading-none';

const EXPANSION_METRIC_VALUE_CLASS = 'text-right text-[10px] tabular-nums leading-tight';

function ExpansionMetricStack({ items }: { items: MetricItem[] }) {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p
            className={cn(EXPANSION_METRIC_LABEL_CLASS, PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL)}
          >
            {item.label}
          </p>
          <p
            className={cn(
              EXPANSION_METRIC_VALUE_CLASS,
              PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE,
              'mt-0.5',
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function orderPoolMetrics(unit: DeliveryPayableUnit): MetricItem[] {
  return [
    { label: 'Planned', value: fmt(unit.totalPlannedBonus) },
    { label: 'Paid', value: fmt(unit.totalPaidBonus) },
  ];
}

function employeeRunMetrics(employee: PayrollAllocationMatrixEmployee): MetricItem[] {
  return [
    { label: 'Payable', value: fmt(employee.payableTotal) },
    { label: 'Bonus', value: fmt(employee.bonusTotalThisRun) },
  ];
}

function intersectionMetrics(cell: PayrollAllocationMatrixCell): MetricItem[] {
  return [
    { label: 'Due', value: fmt(cell.remaining) },
    { label: 'Paid', value: fmt(cell.paidBefore) },
  ];
}

/** Column expansion — pool summary header (thead). */
export function MatrixOrderDetailHeader({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS}>
      <ExpansionMetricStack items={orderPoolMetrics(unit)} />
    </th>
  );
}

export function MatrixEmployeeDetailHeader({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS}>
      <ExpansionMetricStack items={employeeRunMetrics(employee)} />
    </th>
  );
}

/** Row expansion — sticky summary (first cell of detail row). */
export function MatrixOrderRowDetailSticky({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS}>
      <ExpansionMetricStack items={orderPoolMetrics(unit)} />
    </th>
  );
}

export function MatrixEmployeeRowDetailSticky({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS}>
      <ExpansionMetricStack items={employeeRunMetrics(employee)} />
    </th>
  );
}

/** Due/Paid — one cell in the detail column (column expand) or detail row (row expand). */
export function MatrixCellDetailPanel({ cell }: { cell: PayrollAllocationMatrixCell | undefined }) {
  if (!cell?.linked) {
    return (
      <td className={PAYROLL_MATRIX_EXPANSION_CELL_CLASS}>
        <p className={cn('text-center text-[10px]', PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL)}>
          —
        </p>
      </td>
    );
  }

  return (
    <td className={PAYROLL_MATRIX_EXPANSION_CELL_CLASS}>
      <ExpansionMetricStack items={intersectionMetrics(cell)} />
    </td>
  );
}
