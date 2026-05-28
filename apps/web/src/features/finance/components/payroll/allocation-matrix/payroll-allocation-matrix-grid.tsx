'use client';

import { useMemo } from 'react';
import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_MATRIX_CELL_CLASS } from '@/features/finance/constants/payroll-allocation-matrix-cell';
import {
  MatrixCellDetailPanel,
  MatrixEmployeeDetailHeader,
  MatrixOrderDetailHeader,
  MatrixRowDetailLabel,
} from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-detail-panel';
import {
  PAYROLL_MATRIX_BODY_CLASS,
  PAYROLL_MATRIX_BODY_FULLSCREEN_CLASS,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
  PAYROLL_MATRIX_DATA_COL_WIDTH_EXPANDED,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
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
import { PAYROLL_MATRIX_STICKY_HEADER_BG } from '@/features/finance/constants/payroll-allocation-matrix-layout';
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
  fullscreen?: boolean;
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
    fullscreen = false,
  } = props;

  const cellsByKey = useMemo(() => cellMap(matrix.cells), [matrix.cells]);

  const rows: MatrixRowHeader[] =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.employees.map((e) => ({
          id: e.employeeId,
          primary: employeeName(e),
          secondary: formatAmount(Number.parseFloat(e.baseSalary)),
          meta: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
          funding: null,
          pinned: false,
          kind: 'employee' as const,
        }))
      : matrix.deliveryUnits.map((u) => ({
          id: u.orderId,
          primary: u.label,
          secondary: '',
          meta: formatAmount(Number.parseFloat(u.totalRemainingBonus)),
          funding: formatAmount(Number.parseFloat(u.availableFunding)),
          pinned: pinnedUnitIds.includes(u.orderId),
          kind: 'order' as const,
        }));

  const headerColumns: MatrixHeaderColumn[] =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.deliveryUnits.map((u) => ({
          id: u.orderId,
          primary: u.label,
          secondary: '',
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

  const renderAfterColumn = (columnId: string) => {
    if (viewMode === 'EMPLOYEE_MATRIX') {
      const unit = matrix.deliveryUnits.find((u) => u.orderId === columnId);
      return unit ? <MatrixOrderDetailHeader key={`${columnId}-pool`} unit={unit} /> : null;
    }
    const employee = matrix.employees.find((e) => e.employeeId === columnId);
    return employee ? (
      <MatrixEmployeeDetailHeader key={`${columnId}-emp`} employee={employee} />
    ) : null;
  };

  const renderAfterRow = (rowId: string) => {
    const detailCells = columnIds.flatMap((colId) => {
      const cell = resolveCell(rowId, colId);
      const items = [<MatrixCellDetailPanel key={`${rowId}-${colId}-d`} cell={cell} />];
      if (activeColumnId === colId) {
        items.push(
          <td
            key={`${rowId}-${colId}-pad`}
            className="border-border bg-muted/15 border-r border-b"
          />,
        );
      }
      return items;
    });

    const orderUnit =
      viewMode === 'ORDER_MATRIX' ? matrix.deliveryUnits.find((u) => u.orderId === rowId) : null;
    const employee =
      viewMode === 'EMPLOYEE_MATRIX' ? matrix.employees.find((e) => e.employeeId === rowId) : null;

    return (
      <tr key={`${rowId}-detail`}>
        {orderUnit ? (
          <th
            className={cn(
              'border-border sticky left-0 z-30 min-w-[11.5rem] border-r border-b px-3 py-1.5 text-left',
              PAYROLL_MATRIX_STICKY_HEADER_BG,
            )}
          >
            <p className="text-muted-foreground text-[9px] font-medium tracking-wide uppercase">
              Order pool
            </p>
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-muted-foreground text-[10px]">
                Pln{' '}
                <span className="text-foreground tabular-nums">
                  {formatAmount(Number.parseFloat(orderUnit.totalPlannedBonus))}
                </span>
              </p>
              <p className="text-muted-foreground text-[10px]">
                Avl{' '}
                <span className="text-foreground tabular-nums">
                  {formatAmount(Number.parseFloat(orderUnit.availableFunding))}
                </span>
              </p>
            </div>
          </th>
        ) : employee ? (
          <th
            className={cn(
              'border-border sticky left-0 z-30 min-w-[11.5rem] border-r border-b px-3 py-1.5 text-left',
              PAYROLL_MATRIX_STICKY_HEADER_BG,
            )}
          >
            <p className="text-muted-foreground text-[9px] font-medium tracking-wide uppercase">
              Employee
            </p>
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-muted-foreground text-[10px]">
                Sal{' '}
                <span className="text-foreground tabular-nums">
                  {formatAmount(Number.parseFloat(employee.baseSalary))}
                </span>
              </p>
              <p className="text-muted-foreground text-[10px]">
                Bon{' '}
                <span className="text-foreground tabular-nums">
                  {formatAmount(Number.parseFloat(employee.bonusTotalThisRun))}
                </span>
              </p>
            </div>
          </th>
        ) : (
          <MatrixRowDetailLabel title="Breakdown" />
        )}
        {detailCells}
      </tr>
    );
  };

  const renderDataCells = (rowId: string) =>
    columnIds.flatMap((colId) => {
      const cell = resolveCell(rowId, colId);
      const expanded = activeColumnId === colId;
      const dataTd = !cell ? (
        <td
          key={colId}
          className={cn(
            'border-border bg-card border-r border-b',
            PAYROLL_MATRIX_DATA_COL_WIDTH,
            expanded && PAYROLL_MATRIX_DATA_COL_WIDTH_EXPANDED,
          )}
        />
      ) : (
        <td
          key={colId}
          className={cn(
            'border-border border-r border-b p-0 align-middle',
            PAYROLL_MATRIX_DATA_COL_WIDTH,
            expanded && PAYROLL_MATRIX_DATA_COL_WIDTH_EXPANDED,
            PAYROLL_MATRIX_CELL_CLASS[cell.state],
          )}
        >
          <button
            type="button"
            disabled={!cell.editable && cell.state === 'UNLINKED'}
            className={cn(
              'box-border flex h-full min-h-[2.75rem] w-full flex-col items-center justify-center px-1 py-1 tabular-nums',
              !cell.editable &&
                cell.state === 'UNLINKED' &&
                'cursor-not-allowed disabled:opacity-100',
            )}
            onClick={() => onCellClick(cell)}
          >
            <span>
              {Number.parseFloat(cell.releaseThisMonth) > 0
                ? formatAmount(Number.parseFloat(cell.releaseThisMonth))
                : '—'}
            </span>
            {cell.warning ? <span className="text-[10px] font-medium">{cell.warning}</span> : null}
          </button>
        </td>
      );

      const detailTd =
        expanded && cell ? (
          <MatrixCellDetailPanel key={`${colId}-inline`} cell={cell} />
        ) : expanded ? (
          <MatrixCellDetailPanel key={`${colId}-inline`} cell={undefined} />
        ) : null;

      return detailTd ? [dataTd, detailTd] : [dataTd];
    });

  return (
    <div className={fullscreen ? PAYROLL_MATRIX_BODY_FULLSCREEN_CLASS : PAYROLL_MATRIX_BODY_CLASS}>
      <PayrollAllocationMatrixTableShell
        columns={headerColumns}
        rows={rows}
        cornerLabel={cornerLabel}
        cornerCount={rows.length}
        activeColumnId={activeColumnId}
        activeRowId={activeRowId}
        disabled={layoutDisabled}
        onActivateColumn={onActivateColumn}
        onActivateRow={onActivateRow}
        onReorderColumns={onReorderColumns}
        onReorderRows={onReorderRows}
        renderAfterColumn={activeColumnId ? renderAfterColumn : undefined}
        renderAfterRow={activeRowId ? renderAfterRow : undefined}
      >
        {(rowId) => renderDataCells(rowId)}
      </PayrollAllocationMatrixTableShell>
    </div>
  );
}
