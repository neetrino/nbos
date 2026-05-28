'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import {
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE,
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_HEADER_BG,
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

const DETAIL_METRIC_LABEL_CLASS = 'text-left text-[8px] font-bold tracking-wide leading-none';

const DETAIL_METRIC_VALUE_CLASS = 'text-right text-[10px] tabular-nums leading-tight';

/** Label left + bold; amount on next line, right-aligned — same in header and body cells. */
function DetailMetricBlock({ label, value, tone }: MetricItem & { tone: 'header' | 'cell' }) {
  const labelClass =
    tone === 'header'
      ? cn(DETAIL_METRIC_LABEL_CLASS, PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL)
      : cn(DETAIL_METRIC_LABEL_CLASS, 'text-muted-foreground');

  const valueClass =
    tone === 'header'
      ? cn(DETAIL_METRIC_VALUE_CLASS, PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE)
      : cn(DETAIL_METRIC_VALUE_CLASS, 'text-foreground');

  return (
    <div className="min-w-0">
      <p className={labelClass}>{label}</p>
      <p className={cn(valueClass, 'mt-0.5')}>{value}</p>
    </div>
  );
}

function DetailMetricStack({ items, tone }: { items: MetricItem[]; tone: 'header' | 'cell' }) {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => (
        <DetailMetricBlock key={item.label} label={item.label} value={item.value} tone={tone} />
      ))}
    </div>
  );
}

const DETAIL_PANEL_CLASS = cn(
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  'border-border border-r border-b px-1.5 py-1 align-middle',
);

const DETAIL_PANEL_HEADER_CLASS = cn(
  DETAIL_PANEL_CLASS,
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  'align-top pt-2 pb-2',
);

/** Order column — pool totals (Remaining/Avail on main header). */
export function MatrixOrderDetailHeader({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <DetailMetricStack
        tone="header"
        items={[
          { label: 'Planned', value: fmt(unit.totalPlannedBonus) },
          { label: 'Paid', value: fmt(unit.totalPaidBonus) },
        ]}
      />
    </th>
  );
}

/** Employee column — run totals. */
export function MatrixEmployeeDetailHeader({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <DetailMetricStack
        tone="header"
        items={[
          { label: 'Payable', value: fmt(employee.payableTotal) },
          { label: 'Bonus', value: fmt(employee.bonusTotalThisRun) },
        ]}
      />
    </th>
  );
}

/** Per intersection — due and paid before. */
export function MatrixCellDetailPanel({ cell }: { cell: PayrollAllocationMatrixCell | undefined }) {
  if (!cell || !cell.linked) {
    return (
      <td className={DETAIL_PANEL_CLASS}>
        <p className="text-muted-foreground text-center text-[10px]">—</p>
      </td>
    );
  }

  return (
    <td className={DETAIL_PANEL_CLASS}>
      <DetailMetricStack
        tone="cell"
        items={[
          { label: 'Due', value: fmt(cell.remaining) },
          { label: 'Paid', value: fmt(cell.paidBefore) },
        ]}
      />
    </td>
  );
}

const ROW_DETAIL_STICKY_CLASS = cn(
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  'border-border sticky left-0 z-30 min-w-[11.5rem] border-r border-b px-3 py-1 align-middle',
);

export function MatrixOrderRowDetailSticky({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={ROW_DETAIL_STICKY_CLASS}>
      <DetailMetricStack
        tone="cell"
        items={[
          { label: 'Planned', value: fmt(unit.totalPlannedBonus) },
          { label: 'Paid', value: fmt(unit.totalPaidBonus) },
        ]}
      />
    </th>
  );
}

export function MatrixEmployeeRowDetailSticky({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={ROW_DETAIL_STICKY_CLASS}>
      <DetailMetricStack
        tone="cell"
        items={[
          { label: 'Payable', value: fmt(employee.payableTotal) },
          { label: 'Bonus', value: fmt(employee.bonusTotalThisRun) },
        ]}
      />
    </th>
  );
}
