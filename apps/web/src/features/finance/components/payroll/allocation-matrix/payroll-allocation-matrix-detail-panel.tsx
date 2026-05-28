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

function MetricCell({ label, value }: MetricItem) {
  return (
    <p className="text-muted-foreground min-w-0 leading-tight">
      <span className="text-[8px] font-medium tracking-wide uppercase">{label} </span>
      <span className="text-foreground text-[10px] tabular-nums">{value}</span>
    </p>
  );
}

function HeaderMetricStack({ items }: { items: MetricItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <p key={item.label} className="min-w-0 leading-tight">
          <span
            className={cn(
              'text-[8px] font-medium tracking-wide uppercase',
              PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL,
            )}
          >
            {item.label}{' '}
          </span>
          <span
            className={cn('text-[10px] tabular-nums', PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE)}
          >
            {item.value}
          </span>
        </p>
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

/** Order column — pool totals stacked (Remaining/Avail on main header). */
export function MatrixOrderDetailHeader({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <HeaderMetricStack
        items={[
          { label: 'Planned', value: fmt(unit.totalPlannedBonus) },
          { label: 'Paid', value: fmt(unit.totalPaidBonus) },
        ]}
      />
    </th>
  );
}

/** Employee column — run totals stacked. */
export function MatrixEmployeeDetailHeader({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <HeaderMetricStack
        items={[
          { label: 'Payable', value: fmt(employee.payableTotal) },
          { label: 'Bonus', value: fmt(employee.bonusTotalThisRun) },
        ]}
      />
    </th>
  );
}

/** Per intersection — remaining due and paid before. */
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
      <div className="flex flex-col gap-0.5">
        <MetricCell label="Due" value={fmt(cell.remaining)} />
        <MetricCell label="Paid" value={fmt(cell.paidBefore)} />
      </div>
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
      <div className="flex flex-col gap-0.5">
        <MetricCell label="Planned" value={fmt(unit.totalPlannedBonus)} />
        <MetricCell label="Paid" value={fmt(unit.totalPaidBonus)} />
      </div>
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
      <div className="flex flex-col gap-0.5">
        <MetricCell label="Payable" value={fmt(employee.payableTotal)} />
        <MetricCell label="Bonus" value={fmt(employee.bonusTotalThisRun)} />
      </div>
    </th>
  );
}
