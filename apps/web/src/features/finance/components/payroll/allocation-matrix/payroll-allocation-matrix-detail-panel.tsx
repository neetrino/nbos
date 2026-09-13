'use client';

import { useTranslations } from 'next-intl';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_EXPANSION_CELL_CLASS,
  PAYROLL_MATRIX_EXPANSION_ROW_CELL_CLASS,
  PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS,
  PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS,
  PAYROLL_MATRIX_EXPANSION_ROW_STICKY_STYLE,
} from '@/features/finance/constants/payroll-allocation-matrix-expansion';
import {
  PAYROLL_MATRIX_DATA_COL_STYLE,
  PAYROLL_MATRIX_DETAIL_COL_STYLE,
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

const EXPANSION_METRIC_LABEL_CLASS =
  'text-muted-foreground text-left text-[8px] font-bold tracking-wide leading-none';

const EXPANSION_METRIC_VALUE_CLASS =
  'text-foreground text-right text-[10px] tabular-nums leading-tight';

function ExpansionMetricStack({ items }: { items: MetricItem[] }) {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => (
        <div key={item.label} className="max-w-full min-w-0">
          <p className={cn(EXPANSION_METRIC_LABEL_CLASS, 'truncate')}>{item.label}</p>
          <p className={cn(EXPANSION_METRIC_VALUE_CLASS, 'mt-0.5 truncate')}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function orderPoolMetrics(
  unit: DeliveryPayableUnit,
  plannedLabel: string,
  paidLabel: string,
): MetricItem[] {
  return [
    { label: plannedLabel, value: fmt(unit.totalPlannedBonus) },
    { label: paidLabel, value: fmt(unit.totalPaidBonus) },
  ];
}

function employeeRunMetrics(
  employee: PayrollAllocationMatrixEmployee,
  salaryLabel: string,
  bonusLabel: string,
): MetricItem[] {
  return [
    { label: salaryLabel, value: fmt(employee.baseSalary) },
    { label: bonusLabel, value: fmt(employee.bonusTotalThisRun) },
  ];
}

function intersectionMetrics(
  cell: PayrollAllocationMatrixCell,
  payableLabel: string,
  dueLabel: string,
  paidLabel: string,
): MetricItem[] {
  return [
    { label: payableLabel, value: fmt(cell.plannedAmount) },
    { label: dueLabel, value: fmt(cell.remaining) },
    { label: paidLabel, value: fmt(cell.paidBefore) },
  ];
}

/** Column expansion — pool summary header (thead). */
export function MatrixOrderDetailHeader({ unit }: { unit: DeliveryPayableUnit }) {
  const t = useTranslations('payroll');
  return (
    <th
      style={PAYROLL_MATRIX_DETAIL_COL_STYLE}
      className={PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS}
    >
      <ExpansionMetricStack
        items={orderPoolMetrics(unit, t('matrix.header.planned'), t('matrix.paid'))}
      />
    </th>
  );
}

export function MatrixEmployeeDetailHeader({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  const t = useTranslations('payroll');
  return (
    <th
      style={PAYROLL_MATRIX_DETAIL_COL_STYLE}
      className={PAYROLL_MATRIX_EXPANSION_COLUMN_HEADER_CLASS}
    >
      <ExpansionMetricStack
        items={employeeRunMetrics(employee, t('matrix.header.salary'), t('matrix.header.bonus'))}
      />
    </th>
  );
}

/** Row expansion — pool summary in sticky edge (Planned/Paid or Payable/Bonus). */
export function MatrixOrderRowDetailSticky({ unit }: { unit: DeliveryPayableUnit }) {
  const t = useTranslations('payroll');
  return (
    <th
      style={PAYROLL_MATRIX_EXPANSION_ROW_STICKY_STYLE}
      className={PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS}
    >
      <ExpansionMetricStack
        items={orderPoolMetrics(unit, t('matrix.header.planned'), t('matrix.paid'))}
      />
    </th>
  );
}

export function MatrixEmployeeRowDetailSticky({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  const t = useTranslations('payroll');
  return (
    <th
      style={PAYROLL_MATRIX_EXPANSION_ROW_STICKY_STYLE}
      className={PAYROLL_MATRIX_EXPANSION_ROW_STICKY_CLASS}
    >
      <ExpansionMetricStack
        items={employeeRunMetrics(employee, t('matrix.header.salary'), t('matrix.header.bonus'))}
      />
    </th>
  );
}

/** Due/Paid — one cell in the detail column (column expand) or detail row (row expand). */
export function MatrixCellDetailPanel({
  cell,
  layout = 'column',
}: {
  cell: PayrollAllocationMatrixCell | undefined;
  layout?: 'column' | 'row';
}) {
  const t = useTranslations('payroll');
  const cellClass =
    layout === 'row'
      ? PAYROLL_MATRIX_EXPANSION_ROW_CELL_CLASS
      : PAYROLL_MATRIX_EXPANSION_CELL_CLASS;

  if (!cell?.linked) {
    return (
      <td
        style={layout === 'row' ? PAYROLL_MATRIX_DATA_COL_STYLE : PAYROLL_MATRIX_DETAIL_COL_STYLE}
        className={cellClass}
      >
        <p className="text-muted-foreground text-center text-[10px]">—</p>
      </td>
    );
  }

  return (
    <td
      style={layout === 'row' ? PAYROLL_MATRIX_DATA_COL_STYLE : PAYROLL_MATRIX_DETAIL_COL_STYLE}
      className={cellClass}
    >
      <ExpansionMetricStack
        items={intersectionMetrics(
          cell,
          t('matrix.payable'),
          t('matrix.header.due'),
          t('matrix.paid'),
        )}
      />
    </td>
  );
}
