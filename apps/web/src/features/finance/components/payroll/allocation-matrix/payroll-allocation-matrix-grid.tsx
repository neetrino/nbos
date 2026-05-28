'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_MATRIX_CELL_CLASS } from '@/features/finance/constants/payroll-allocation-matrix-cell';
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
  activeRowId: string | null;
  activeColumnId: string | null;
  onActivateRow: (id: string | null) => void;
  onActivateColumn: (id: string | null) => void;
  onCellClick: (cell: PayrollAllocationMatrixCell) => void;
}) {
  const {
    matrix,
    viewMode,
    pinnedUnitIds,
    activeRowId,
    activeColumnId,
    onActivateRow,
    onActivateColumn,
    onCellClick,
  } = props;

  const cellsByKey = useMemo(() => cellMap(matrix.cells), [matrix.cells]);

  const rows =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.employees.map((e) => ({
          id: e.employeeId,
          primary: employeeName(e),
          secondary: formatAmount(Number.parseFloat(e.baseSalary)),
          meta: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
        }))
      : matrix.deliveryUnits.map((u) => ({
          id: u.orderId,
          primary: u.label,
          secondary: u.projectCode,
          meta: formatAmount(Number.parseFloat(u.totalRemainingBonus)),
        }));

  const columns =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.deliveryUnits.map((u) => ({
          id: u.orderId,
          primary: u.label,
          secondary: u.projectCode,
          meta: formatAmount(Number.parseFloat(u.totalRemainingBonus)),
          funding: formatAmount(Number.parseFloat(u.availableFunding)),
        }))
      : matrix.employees.map((e) => ({
          id: e.employeeId,
          primary: employeeName(e),
          secondary: e.position ?? '—',
          meta: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
          funding: null as string | null,
        }));

  const resolveCell = (rowId: string, colId: string): PayrollAllocationMatrixCell | undefined => {
    const employeeId = viewMode === 'EMPLOYEE_MATRIX' ? rowId : colId;
    const orderId = viewMode === 'EMPLOYEE_MATRIX' ? colId : rowId;
    return cellsByKey.get(`${employeeId}:${orderId}`);
  };

  return (
    <div className="border-border bg-card max-h-[min(70vh,48rem)] overflow-auto rounded-xl border">
      <table className="w-max min-w-full border-collapse text-xs">
        <thead className="bg-card sticky top-0 z-20">
          <tr>
            <th className="bg-card border-border sticky left-0 z-30 min-w-[11rem] border-r border-b px-3 py-2 text-left font-semibold">
              {viewMode === 'EMPLOYEE_MATRIX' ? 'Employee' : 'Delivery unit'}
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  'border-border min-w-[7.5rem] border-r border-b px-2 py-2 text-left align-bottom',
                  activeColumnId === col.id && 'bg-primary/10',
                )}
              >
                <button
                  type="button"
                  className="hover:text-primary w-full text-left"
                  onClick={() => onActivateColumn(activeColumnId === col.id ? null : col.id)}
                >
                  <p className="line-clamp-2 font-semibold">
                    {pinnedUnitIds.includes(col.id) ? '📌 ' : ''}
                    {col.primary}
                  </p>
                  <p className="text-muted-foreground truncate">{col.secondary}</p>
                  <p className="text-muted-foreground tabular-nums">{col.meta}</p>
                  {col.funding ? (
                    <p className="text-muted-foreground tabular-nums">Avail {col.funding}</p>
                  ) : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th
                className={cn(
                  'bg-card border-border sticky left-0 z-10 border-r border-b px-3 py-2 text-left font-medium',
                  activeRowId === row.id && 'bg-primary/10',
                )}
              >
                <button
                  type="button"
                  className="hover:text-primary w-full text-left"
                  onClick={() => onActivateRow(activeRowId === row.id ? null : row.id)}
                >
                  <p>{row.primary}</p>
                  <p className="text-muted-foreground tabular-nums">{row.secondary}</p>
                  <p className="text-muted-foreground tabular-nums">Bonus {row.meta}</p>
                </button>
              </th>
              {columns.map((col) => {
                const cell = resolveCell(row.id, col.id);
                if (!cell) return <td key={col.id} className="border-border border-r border-b" />;
                const display =
                  Number.parseFloat(cell.releaseThisMonth) > 0
                    ? formatAmount(Number.parseFloat(cell.releaseThisMonth))
                    : '—';
                return (
                  <td key={col.id} className="border-border border-r border-b p-0">
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
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
