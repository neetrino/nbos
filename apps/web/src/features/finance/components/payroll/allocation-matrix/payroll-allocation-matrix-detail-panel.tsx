'use client';

import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_MATRIX_DETAIL_COL_WIDTH } from '@/features/finance/constants/payroll-allocation-matrix-layout';
import { PAYROLL_MATRIX_STICKY_HEADER_BG } from '@/features/finance/constants/payroll-allocation-matrix-layout';
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
    <div className="min-w-0 leading-none">
      <p className="text-muted-foreground truncate text-[8px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground truncate text-[10px] tabular-nums">{value}</p>
    </div>
  );
}

function MetricGrid1x2({ left, right }: { left: MetricItem; right: MetricItem }) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5">
      <MetricCell {...left} />
      <MetricCell {...right} />
    </div>
  );
}

/** Two columns × two rows — keeps row height close to standard matrix cells. */
function MetricGrid2x2({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: {
  topLeft: MetricItem;
  topRight: MetricItem;
  bottomLeft: MetricItem;
  bottomRight: MetricItem;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-1">
      <MetricCell {...topLeft} />
      <MetricCell {...topRight} />
      <MetricCell {...bottomLeft} />
      <MetricCell {...bottomRight} />
    </div>
  );
}

const DETAIL_PANEL_CLASS = cn(
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  PAYROLL_MATRIX_DETAIL_COL_WIDTH,
  'border-border border-r border-b px-2 py-1 align-middle',
);

const DETAIL_PANEL_HEADER_CLASS = cn(DETAIL_PANEL_CLASS, 'align-top pt-2 pb-2 text-center');

function HeaderMetricCell({ label, value }: MetricItem) {
  return (
    <div className="min-w-0 leading-none">
      <p className="text-muted-foreground text-[8px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground text-[10px] tabular-nums">{value}</p>
    </div>
  );
}

function HeaderMetricGrid1x2({ left, right }: { left: MetricItem; right: MetricItem }) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5">
      <HeaderMetricCell {...left} />
      <HeaderMetricCell {...right} />
    </div>
  );
}

/** Order column — pool totals (Remaining/Avail stay on the main header). */
export function MatrixOrderDetailHeader({ unit }: { unit: DeliveryPayableUnit }) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <p className="text-muted-foreground mb-1 text-[8px] font-medium tracking-wide uppercase">
        Bonus pool
      </p>
      <HeaderMetricGrid1x2
        left={{ label: 'Planned', value: fmt(unit.totalPlannedBonus) }}
        right={{ label: 'Paid', value: fmt(unit.totalPaidBonus) }}
      />
    </th>
  );
}

/** Employee column — run totals (salary/bonus stay on the main header). */
export function MatrixEmployeeDetailHeader({
  employee,
}: {
  employee: PayrollAllocationMatrixEmployee;
}) {
  return (
    <th className={DETAIL_PANEL_HEADER_CLASS}>
      <p className="text-muted-foreground mb-1 text-[8px] font-medium tracking-wide uppercase">
        Pay run
      </p>
      <HeaderMetricGrid1x2
        left={{ label: 'Payable', value: fmt(employee.payableTotal) }}
        right={{ label: 'Bonus run', value: fmt(employee.bonusTotalThisRun) }}
      />
    </th>
  );
}

/** Per intersection — due left, paid right; suggestion & release on second row. */
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
      <MetricGrid2x2
        topLeft={{ label: 'Due', value: fmt(cell.remaining) }}
        topRight={{ label: 'Paid', value: fmt(cell.paidBefore) }}
        bottomLeft={{ label: 'Suggest', value: fmt(cell.suggestedThisMonth) }}
        bottomRight={{ label: 'Release', value: fmt(cell.releaseThisMonth) }}
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
      <p className="text-muted-foreground mb-1 text-[8px] font-medium tracking-wide uppercase">
        Order bonus
      </p>
      <MetricGrid2x2
        topLeft={{ label: 'Planned', value: fmt(unit.totalPlannedBonus) }}
        topRight={{ label: 'Paid', value: fmt(unit.totalPaidBonus) }}
        bottomLeft={{ label: 'Released', value: fmt(unit.totalReleasedBonus) }}
        bottomRight={{
          label: parseMoney(unit.overFundingAmount) > 0 ? 'Over' : '—',
          value: parseMoney(unit.overFundingAmount) > 0 ? fmt(unit.overFundingAmount) : '—',
        }}
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
      <p className="text-muted-foreground mb-1 text-[8px] font-medium tracking-wide uppercase">
        Employee
      </p>
      <div className="grid grid-cols-2 gap-x-2.5">
        <MetricCell label="Payable" value={fmt(employee.payableTotal)} />
        <MetricCell label="Bonus run" value={fmt(employee.bonusTotalThisRun)} />
      </div>
    </th>
  );
}
