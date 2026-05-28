'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_MATRIX_STICKY_HEADER_BG } from '@/features/finance/constants/payroll-allocation-matrix-layout';
import type {
  DeliveryPayableUnit,
  PayrollAllocationMatrixCell,
  PayrollAllocationMatrixEmployee,
} from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function parseMoney(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: string): string {
  return formatAmount(parseMoney(value));
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-muted-foreground leading-tight">
      <span className="text-[9px] uppercase">{label}</span>{' '}
      <span className="text-foreground text-[10px] font-normal tabular-nums">{value}</span>
    </p>
  );
}

const DETAIL_PANEL_CLASS = cn(
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  'border-border min-w-[9.5rem] max-w-[9.5rem] border-r border-b px-2 py-1.5 text-left align-top',
);

const DETAIL_PANEL_HEADER_CLASS = cn(
  DETAIL_PANEL_CLASS,
  'align-bottom',
  PAYROLL_MATRIX_STICKY_HEADER_BG,
);

/** Order column — summary in detail header row. */
export function MatrixOrderDetailHeader({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <p className="text-muted-foreground mb-1 text-[9px] font-medium tracking-wide uppercase">
        Order pool
      </p>
      <div className="flex flex-col gap-0.5">
        <MetricLine label="Pln" value={fmt(unit.totalPlannedBonus)} />
        <MetricLine label="Avl" value={fmt(unit.availableFunding)} />
        <MetricLine label="Paid" value={fmt(unit.totalPaidBonus)} />
        <MetricLine label="Rem" value={fmt(unit.totalRemainingBonus)} />
      </div>
    </th>
  );
}

/** Employee column — summary in detail header (order × employees view). */
export function MatrixEmployeeDetailHeader({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <p className="text-muted-foreground mb-1 text-[9px] font-medium tracking-wide uppercase">
        Employee
      </p>
      <div className="flex flex-col gap-0.5">
        <MetricLine label="Sal" value={fmt(employee.baseSalary)} />
        <MetricLine label="Bon" value={fmt(employee.bonusTotalThisRun)} />
        <MetricLine label="Pay" value={fmt(employee.payableTotal)} />
      </div>
    </th>
  );
}

/** Per intersection — employee × order cell metrics. */
export function MatrixCellDetailPanel({ cell }: { cell: PayrollAllocationMatrixCell | undefined }) {
  if (!cell || !cell.linked) {
    return (
      <td className={DETAIL_PANEL_CLASS}>
        <p className="text-muted-foreground text-[10px]">—</p>
      </td>
    );
  }

  return (
    <td className={DETAIL_PANEL_CLASS}>
      <div className="flex flex-col gap-0.5">
        <MetricLine label="Pln" value={fmt(cell.plannedAmount)} />
        <MetricLine label="Rel" value={fmt(cell.releaseThisMonth)} />
        <MetricLine label="Paid" value={fmt(cell.paidBefore)} />
        <MetricLine label="Rem" value={fmt(cell.remaining)} />
        <MetricLine label="Sug" value={fmt(cell.suggestedThisMonth)} />
      </div>
    </td>
  );
}

/** Expanded row — sticky label cell. */
export function MatrixRowDetailLabel({ title }: { title: string }) {
  return (
    <th
      className={cn(
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        'border-border sticky left-0 z-30 min-w-[11.5rem] border-r border-b px-3 py-1.5 text-left',
      )}
    >
      <p className="text-muted-foreground text-[9px] font-medium tracking-wide uppercase">
        {title}
      </p>
    </th>
  );
}
