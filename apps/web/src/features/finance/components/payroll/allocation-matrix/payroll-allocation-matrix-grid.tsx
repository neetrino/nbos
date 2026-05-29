'use client';

import { useMemo } from 'react';
import { PayrollAllocationMatrixCellInput } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-cell-input';
import { formatAmount } from '@/features/finance/constants/finance';
import { PAYROLL_MATRIX_CELL_CLASS } from '@/features/finance/constants/payroll-allocation-matrix-cell';
import {
  MatrixCellDetailPanel,
  MatrixEmployeeDetailHeader,
  MatrixEmployeeRowDetailSticky,
  MatrixOrderDetailHeader,
  MatrixOrderRowDetailSticky,
} from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-detail-panel';
import {
  PAYROLL_MATRIX_BODY_CLASS,
  PAYROLL_MATRIX_BODY_FULLSCREEN_CLASS,
  PAYROLL_MATRIX_DATA_COL_STYLE,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import {
  PayrollAllocationMatrixTableShell,
  type MatrixEmployeeAmounts,
  type MatrixHeaderColumn,
  type MatrixRowHeader,
} from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-sortable-headers';
import {
  MatrixEmployeeTotalsCell,
  MatrixEmployeeTotalsFooterCell,
  MatrixEmployeeTotalsFooterCorner,
  MatrixEmployeeTotalsFooterDetailSpacer,
  MatrixEmployeeTotalsHeader,
  MatrixEmployeeTotalsSpacerCell,
} from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-employee-totals';
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

function cellKey(cell: PayrollAllocationMatrixCell): string {
  return `${cell.employeeId}:${cell.orderId}`;
}

function needsManualBonus(cell: PayrollAllocationMatrixCell, editable: boolean): boolean {
  return (
    editable &&
    (cell.state === 'UNLINKED' ||
      (cell.state === 'LINKED_EMPTY' && !cell.bonusEntryId && cell.linked))
  );
}

function employeeAmounts(e: {
  baseSalary: string;
  bonusTotalThisRun: string;
  payableTotal: string;
}): MatrixEmployeeAmounts {
  return {
    baseSalary: formatAmount(Number.parseFloat(e.baseSalary)),
    bonusTotal: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
    payableTotal: formatAmount(Number.parseFloat(e.payableTotal)),
  };
}

export function PayrollAllocationMatrixGrid(props: {
  matrix: PayrollAllocationMatrix;
  viewMode: PayrollMatrixViewMode;
  pinnedUnitIds: string[];
  layoutDisabled: boolean;
  activeRowId: string | null;
  activeColumnId: string | null;
  savingCellKey: string | null;
  onActivateRow: (id: string | null) => void;
  onActivateColumn: (id: string | null) => void;
  onReorderColumns: (orderedIds: string[]) => void;
  onReorderRows: (orderedIds: string[]) => void;
  onManualCellRequest: (cell: PayrollAllocationMatrixCell) => void;
  onReleaseSave: (
    cell: PayrollAllocationMatrixCell,
    payload: { releaseThisMonth: string; reason?: string },
  ) => Promise<void>;
  onOpenSalaryLine?: (salaryLineId: string) => void;
  fullscreen?: boolean;
}) {
  const {
    matrix,
    viewMode,
    pinnedUnitIds,
    layoutDisabled,
    activeRowId,
    activeColumnId,
    savingCellKey,
    onActivateRow,
    onActivateColumn,
    onReorderColumns,
    onReorderRows,
    onManualCellRequest,
    onReleaseSave,
    onOpenSalaryLine,
    fullscreen = false,
  } = props;

  const cellsByKey = useMemo(() => cellMap(matrix.cells), [matrix.cells]);
  const fundingByOrderId = useMemo(
    () =>
      new Map(matrix.deliveryUnits.map((u) => [u.orderId, Number.parseFloat(u.availableFunding)])),
    [matrix.deliveryUnits],
  );

  const rows: MatrixRowHeader[] =
    viewMode === 'EMPLOYEE_MATRIX'
      ? matrix.employees.map((e) => ({
          id: e.employeeId,
          primary: employeeName(e),
          secondary: formatAmount(Number.parseFloat(e.baseSalary)),
          meta: formatAmount(Number.parseFloat(e.bonusTotalThisRun)),
          employeeAmounts: employeeAmounts(e),
          salaryLineId: e.salaryLineId,
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
          employeeAmounts: employeeAmounts(e),
          salaryLineId: e.salaryLineId,
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
    const detailCells = columnIds.map((colId) => {
      const cell = resolveCell(rowId, colId);
      return <MatrixCellDetailPanel key={`${rowId}-${colId}-d`} cell={cell} layout="row" />;
    });

    const orderUnit =
      viewMode === 'ORDER_MATRIX' ? matrix.deliveryUnits.find((u) => u.orderId === rowId) : null;
    const employee =
      viewMode === 'EMPLOYEE_MATRIX' ? matrix.employees.find((e) => e.employeeId === rowId) : null;

    return (
      <tr key={`${rowId}-detail`}>
        {orderUnit ? (
          <MatrixOrderRowDetailSticky unit={orderUnit} />
        ) : employee ? (
          <MatrixEmployeeRowDetailSticky employee={employee} />
        ) : null}
        {detailCells}
        {viewMode === 'EMPLOYEE_MATRIX' ? <MatrixEmployeeTotalsSpacerCell /> : null}
      </tr>
    );
  };

  const renderDataCells = (rowId: string) =>
    columnIds.flatMap((colId) => {
      const cell = resolveCell(rowId, colId);
      const columnActive = activeColumnId === colId;
      const orderId = viewMode === 'EMPLOYEE_MATRIX' ? colId : rowId;
      const availableFunding = fundingByOrderId.get(orderId) ?? 0;

      const dataTd = !cell ? (
        <td
          key={colId}
          style={PAYROLL_MATRIX_DATA_COL_STYLE}
          className={cn('border-border bg-card border-r border-b', PAYROLL_MATRIX_DATA_COL_WIDTH)}
        />
      ) : needsManualBonus(cell, matrix.editable) ? (
        <td
          key={colId}
          style={PAYROLL_MATRIX_DATA_COL_STYLE}
          className={cn(
            'border-border border-r border-b p-0 align-middle',
            PAYROLL_MATRIX_DATA_COL_WIDTH,
            PAYROLL_MATRIX_CELL_CLASS[cell.state],
          )}
        >
          <button
            type="button"
            aria-label="Create manual bonus"
            className="box-border flex h-full min-h-[2.25rem] w-full min-w-0 cursor-pointer px-1 py-0.5 hover:bg-sky-500/10"
            onClick={() => onManualCellRequest(cell)}
          />
        </td>
      ) : (
        <td
          key={colId}
          style={PAYROLL_MATRIX_DATA_COL_STYLE}
          className={cn(
            'border-border border-r border-b p-0 align-middle',
            PAYROLL_MATRIX_DATA_COL_WIDTH,
            PAYROLL_MATRIX_CELL_CLASS[cell.state],
          )}
        >
          <PayrollAllocationMatrixCellInput
            cell={cell}
            availableFunding={availableFunding}
            disabled={layoutDisabled}
            saving={savingCellKey === cellKey(cell)}
            onSave={(payload) => onReleaseSave(cell, payload)}
          />
        </td>
      );

      const detailTd = columnActive ? (
        <MatrixCellDetailPanel key={`${colId}-inline`} cell={cell} />
      ) : null;

      return detailTd ? [dataTd, detailTd] : [dataTd];
    });

  const renderFooterRow =
    viewMode === 'ORDER_MATRIX'
      ? () => (
          <tr>
            <MatrixEmployeeTotalsFooterCorner />
            {columnIds.flatMap((colId) => {
              const employee = matrix.employees.find((e) => e.employeeId === colId);
              const cells = [
                employee ? (
                  <MatrixEmployeeTotalsFooterCell key={colId} employee={employee} />
                ) : (
                  <td
                    key={colId}
                    style={PAYROLL_MATRIX_DATA_COL_STYLE}
                    className={cn(PAYROLL_MATRIX_DATA_COL_WIDTH, 'border-border border-t border-r')}
                  />
                ),
              ];
              if (activeColumnId === colId) {
                cells.push(<MatrixEmployeeTotalsFooterDetailSpacer key={`${colId}-detail`} />);
              }
              return cells;
            })}
          </tr>
        )
      : undefined;

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
        onOpenSalaryLine={onOpenSalaryLine}
        renderAfterColumn={activeColumnId ? renderAfterColumn : undefined}
        renderAfterRow={activeRowId ? renderAfterRow : undefined}
        renderTotalsHeader={
          viewMode === 'EMPLOYEE_MATRIX' ? () => <MatrixEmployeeTotalsHeader /> : undefined
        }
        renderRowTotals={
          viewMode === 'EMPLOYEE_MATRIX'
            ? (rowId) => {
                const employee = matrix.employees.find((e) => e.employeeId === rowId);
                return employee ? <MatrixEmployeeTotalsCell employee={employee} /> : null;
              }
            : undefined
        }
        renderFooterRow={renderFooterRow}
      >
        {(rowId) => renderDataCells(rowId)}
      </PayrollAllocationMatrixTableShell>
    </div>
  );
}
