'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_MATRIX_CELL_CLASS } from '@/features/finance/constants/payroll-allocation-matrix-cell';
import {
  PayrollAllocationMatrixTableShell,
  type MatrixHeaderColumn,
  type MatrixRowHeader,
} from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-sortable-headers';
import type {
  PayrollAllocationMatrix,
  PayrollAllocationMatrixCell,
  PayrollMatrixViewMode,
} from '@/lib/api/payroll-allocation-matrix';
import { cn } from '@/lib/utils';

function employeeName(e: { firstName: string; lastName: string }): string {
  return `${e.firstName} ${e.lastName}`.trim();
}

function cellMap(cells: PayrollAllocationMatrixCell[]): Map<string, PayrollAllocationMatrixCell> {
  return new Map(cells.map((c) => [`${c.employeeId}:${c.orderId}`, c]));
}

export function PayrollAllocationMatrixGrid(props: {
  matrix: PayrollAllocationMatrix;
  viewMode: PayrollMatrixViewMode;
  pinnedUnitIds: string[];
  layoutDisabled: boolean;
  activeRowId: string | null;
  activeColumnId: string | null;
  onActivateRow: (id: string | null) => void;
  onActivateColumn: (id: string | null) => void;
  onReorderColumns: (orderedIds: string[]) => void;
  onReorderRows: (orderedIds: string[]) => void;
  onCellClick: (cell: PayrollAllocationMatrixCell) => void;
}) {
  const {
    matrix,
    viewMode,
    pinnedUnitIds,
    layoutDisabled,
    activeRowId,
    activeColumnId,
    onActivateRow,
    onActivateColumn,
    onReorderColumns,
    onReorderRows,
    onCellClick,
  } = props;

  const cellsByKey = useMemo(() => cellMap(matrix.cells), [matrix.cells]);

  const rows: MatrixRowHeader[] =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.employees.map((e) => ({
          id: e.employeeId,
          primary: employeeName(e),
          secondary: formatAmount(Number.parseFloat(e.baseSalary)),
          meta: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
          pinned: false,
          kind: 'employee' as const,
        }))
      : matrix.deliveryUnits.map((u) => ({
          id: u.orderId,
          primary: u.label,
          secondary: u.projectCode,
          meta: formatAmount(Number.parseFloat(u.totalRemainingBonus)),
          pinned: pinnedUnitIds.includes(u.orderId),
          kind: 'order' as const,
        }));

  const headerColumns: MatrixHeaderColumn[] =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.deliveryUnits.map((u) => ({
          id: u.orderId,
          primary: u.label,
          secondary: u.projectCode,
          meta: formatAmount(Number.parseFloat(u.totalRemainingBonus)),
          funding: formatAmount(Number.parseFloat(u.availableFunding)),
          pinned: pinnedUnitIds.includes(u.orderId),
          kind: 'order' as const,
        }))
      : matrix.employees.map((e) => ({
          id: e.employeeId,
          primary: employeeName(e),
          secondary: e.position ?? '—',
          meta: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
          funding: null,
          pinned: false,
          kind: 'employee' as const,
        }));

  const columnIds = headerColumns.map((c) => c.id);

  const resolveCell = (rowId: string, colId: string): PayrollAllocationMatrixCell | undefined => {
    const employeeId = viewMode === 'EMPLOYEE_MATRIX' ? rowId : colId;
    const orderId = viewMode === 'EMPLOYEE_MATRIX' ? colId : rowId;
    return cellsByKey.get(`${employeeId}:${orderId}`);
  };

  const cornerLabel = viewMode === 'EMPLOYEE_MATRIX' ? 'Employee' : 'Order';

  return (
    <div className="max-h-[min(70vh,48rem)] overflow-auto">
      <PayrollAllocationMatrixTableShell
        columns={headerColumns}
        rows={rows}
        cornerLabel={cornerLabel}
        activeColumnId={activeColumnId}
        activeRowId={activeRowId}
        disabled={layoutDisabled}
        onActivateColumn={onActivateColumn}
        onActivateRow={onActivateRow}
        onReorderColumns={onReorderColumns}
        onReorderRows={onReorderRows}
      >
        {(rowId) =>
          columnIds.map((colId) => {
            const cell = resolveCell(rowId, colId);
            if (!cell) {
              return <td key={colId} className="border-border border-r border-b" />;
            }
            const display =
              Number.parseFloat(cell.releaseThisMonth) > 0
                ? formatAmount(Number.parseFloat(cell.releaseThisMonth))
                : '—';
            return (
              <td key={colId} className="border-border border-r border-b p-0">
                <button
                  type="button"
                  disabled={!cell.editable && cell.state === 'UNLINKED'}
                  className={cn(
                    'flex min-h-[2.75rem] w-full flex-col items-center justify-center px-1 py-1 tabular-nums',
                    PAYROLL_MATRIX_CELL_CLASS[cell.state],
                    !cell.editable && cell.state === 'UNLINKED' && 'cursor-not-allowed',
                  )}
                  onClick={() => onCellClick(cell)}
                >
                  <span>{display}</span>
                  {cell.warning ? (
                    <span className="text-[10px] font-medium">{cell.warning}</span>
                  ) : null}
                </button>
              </td>
            );
          })
        }
      </PayrollAllocationMatrixTableShell>
    </div>
  );
}
