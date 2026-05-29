'use client';

import { Fragment, type ReactNode } from 'react';
import type { DragEndEvent, DraggableAttributes, SyntheticListenerMap } from '@dnd-kit/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, PanelRightOpen } from 'lucide-react';
import {
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
  PAYROLL_MATRIX_STICKY_EDGE_STYLE,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_ROW_HEADER_ACTIVE_MARK,
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  PAYROLL_MATRIX_TABLE_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import { cn } from '@/lib/utils';

export type MatrixHeaderKind = 'employee' | 'order';

export type MatrixEmployeeAmounts = {
  baseSalary: string;
  bonusTotal: string;
  payableTotal: string;
};

export type MatrixHeaderColumn = {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
  funding: string | null;
  pinned: boolean;
  kind: MatrixHeaderKind;
  employeeAmounts?: MatrixEmployeeAmounts;
  salaryLineId?: string | null;
};

export type MatrixRowHeader = {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
  funding: string | null;
  pinned: boolean;
  kind: MatrixHeaderKind;
  employeeAmounts?: MatrixEmployeeAmounts;
  salaryLineId?: string | null;
};

const MATRIX_PRIMARY_NAME_CLASS =
  'block truncate text-xs font-semibold tracking-tight text-foreground leading-tight';

const MATRIX_HEADER_HOVER_ACTION_CLASS =
  'text-muted-foreground hover:text-foreground absolute top-1 z-10 rounded p-0.5 opacity-0 transition-opacity pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100';

function MatrixLabeledAmount({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-muted-foreground truncate text-[10px] leading-tight font-normal">
      <span>{label} </span>
      <span className="text-foreground font-normal tabular-nums">{value}</span>
    </p>
  );
}

function MatrixEmployeeAmountStack({ amounts }: { amounts: MatrixEmployeeAmounts }) {
  return (
    <>
      <MatrixLabeledAmount label="Salary" value={amounts.baseSalary} />
      <MatrixLabeledAmount label="Bonus" value={amounts.bonusTotal} />
    </>
  );
}

function SortableHeaderBody({
  setNodeRef,
  transform,
  transition,
  isDragging,
  children,
}: {
  setNodeRef: (node: HTMLElement | null) => void;
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null;
  transition: string | undefined;
  isDragging: boolean;
  children: ReactNode;
}) {
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn('min-w-0', isDragging && 'opacity-70')}
    >
      {children}
    </div>
  );
}

function MatrixHeaderDragShell({
  disabled,
  dragLabel,
  onActivate,
  dragAttributes,
  dragListeners,
  onOpenDetail,
  detailAriaLabel,
  children,
}: {
  disabled: boolean;
  dragLabel: string;
  onActivate: () => void;
  dragAttributes: DraggableAttributes;
  dragListeners: SyntheticListenerMap | undefined;
  onOpenDetail?: () => void;
  detailAriaLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative pr-6">
      <button
        type="button"
        className="hover:text-primary w-full min-w-0 overflow-hidden text-left"
        onClick={onActivate}
      >
        {children}
      </button>
      {!disabled && onOpenDetail ? (
        <button
          type="button"
          className={cn(MATRIX_HEADER_HOVER_ACTION_CLASS, 'right-6')}
          aria-label={detailAriaLabel ?? 'Open salary detail'}
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetail();
          }}
        >
          <PanelRightOpen size={14} aria-hidden />
        </button>
      ) : null}
      {!disabled ? (
        <button
          type="button"
          className={cn(
            MATRIX_HEADER_HOVER_ACTION_CLASS,
            'right-1 cursor-grab active:cursor-grabbing',
          )}
          aria-label={dragLabel}
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function PayrollAllocationMatrixTableShell(props: {
  columns: MatrixHeaderColumn[];
  rows: MatrixRowHeader[];
  cornerLabel: string;
  cornerCount: number;
  activeColumnId: string | null;
  activeRowId: string | null;
  disabled: boolean;
  onActivateColumn: (id: string | null) => void;
  onActivateRow: (id: string | null) => void;
  onReorderColumns: (orderedIds: string[]) => void;
  onReorderRows: (orderedIds: string[]) => void;
  renderAfterColumn?: (columnId: string) => ReactNode;
  renderAfterRow?: (rowId: string) => ReactNode;
  renderTotalsHeader?: () => ReactNode;
  renderRowTotals?: (rowId: string) => ReactNode;
  onOpenSalaryLine?: (salaryLineId: string) => void;
  children: (rowId: string) => ReactNode;
}) {
  const {
    columns,
    rows,
    cornerLabel,
    cornerCount,
    activeColumnId,
    activeRowId,
    disabled,
    onActivateColumn,
    onActivateRow,
    onReorderColumns,
    onReorderRows,
    renderAfterColumn,
    renderAfterRow,
    renderTotalsHeader,
    renderRowTotals,
    onOpenSalaryLine,
    children,
  } = props;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const columnIds = columns.map((c) => c.id);
  const rowIds = rows.map((r) => r.id);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const rowOld = rowIds.indexOf(activeId);
    const rowNew = rowIds.indexOf(overId);
    if (rowOld >= 0 && rowNew >= 0) {
      onReorderRows(arrayMove(rowIds, rowOld, rowNew));
      return;
    }

    const colOld = columnIds.indexOf(activeId);
    const colNew = columnIds.indexOf(overId);
    if (colOld >= 0 && colNew >= 0) {
      onReorderColumns(arrayMove(columnIds, colOld, colNew));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <table className={PAYROLL_MATRIX_TABLE_CLASS}>
        <colgroup>
          <col style={{ width: PAYROLL_MATRIX_STICKY_COL_WIDTH }} />
        </colgroup>
        <thead>
          <tr>
            <th
              style={PAYROLL_MATRIX_STICKY_EDGE_STYLE}
              className={cn(
                PAYROLL_MATRIX_STICKY_HEADER_BG,
                PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
                PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
                'border-border sticky top-0 left-0 z-50 border-r border-b px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase',
              )}
            >
              <span className="flex items-baseline gap-1.5">
                <span>{cornerLabel}</span>
                <span className="text-muted-foreground text-[10px] font-medium normal-case tabular-nums">
                  {cornerCount}
                </span>
              </span>
            </th>
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <Fragment key={col.id}>
                  <SortableMatrixColumnHeader
                    col={col}
                    expanded={activeColumnId === col.id}
                    disabled={disabled}
                    onActivate={() => onActivateColumn(activeColumnId === col.id ? null : col.id)}
                    onOpenSalaryLine={onOpenSalaryLine}
                  />
                  {activeColumnId === col.id ? renderAfterColumn?.(col.id) : null}
                </Fragment>
              ))}
            </SortableContext>
            {renderTotalsHeader?.() ?? null}
          </tr>
        </thead>
        <tbody>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {rows.map((row) => (
              <Fragment key={row.id}>
                <tr>
                  <SortableMatrixRowHeader
                    row={row}
                    expanded={activeRowId === row.id}
                    disabled={disabled}
                    onActivate={() => onActivateRow(activeRowId === row.id ? null : row.id)}
                    onOpenSalaryLine={onOpenSalaryLine}
                  />
                  {children(row.id)}
                  {renderRowTotals?.(row.id) ?? null}
                </tr>
                {activeRowId === row.id ? renderAfterRow?.(row.id) : null}
              </Fragment>
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}

function SortableMatrixColumnHeader(props: {
  col: MatrixHeaderColumn;
  expanded: boolean;
  disabled: boolean;
  onActivate: () => void;
  onOpenSalaryLine?: (salaryLineId: string) => void;
}) {
  const { col, expanded, disabled, onActivate, onOpenSalaryLine } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    disabled,
  });
  return (
    <th
      className={cn(
        PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
        PAYROLL_MATRIX_DATA_COL_WIDTH,
        'border-border border-r border-b px-2 py-1.5 text-left align-bottom',
        expanded ? PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG : PAYROLL_MATRIX_STICKY_HEADER_BG,
      )}
    >
      <SortableHeaderBody
        setNodeRef={setNodeRef}
        transform={transform}
        transition={transition}
        isDragging={isDragging}
      >
        <MatrixHeaderDragShell
          disabled={disabled}
          dragLabel="Drag to reorder column"
          onActivate={onActivate}
          dragAttributes={attributes}
          dragListeners={listeners}
          onOpenDetail={
            col.kind === 'employee' && col.salaryLineId && onOpenSalaryLine
              ? () => onOpenSalaryLine(col.salaryLineId!)
              : undefined
          }
          detailAriaLabel={
            col.kind === 'employee' ? `Open salary detail for ${col.primary}` : undefined
          }
        >
          <p className={MATRIX_PRIMARY_NAME_CLASS}>
            {col.pinned ? '📌 ' : ''}
            {col.primary}
          </p>
          {col.kind === 'employee' ? (
            col.employeeAmounts ? (
              <MatrixEmployeeAmountStack amounts={col.employeeAmounts} />
            ) : (
              <>
                {col.secondary ? <MatrixLabeledAmount label="Role" value={col.secondary} /> : null}
                <MatrixLabeledAmount label="Bonus" value={col.meta} />
              </>
            )
          ) : (
            <>
              <MatrixLabeledAmount label="Remaining" value={col.meta} />
              {col.funding ? <MatrixLabeledAmount label="Avail" value={col.funding} /> : null}
            </>
          )}
        </MatrixHeaderDragShell>
      </SortableHeaderBody>
    </th>
  );
}

function SortableMatrixRowHeader(props: {
  row: MatrixRowHeader;
  expanded: boolean;
  disabled: boolean;
  onActivate: () => void;
  onOpenSalaryLine?: (salaryLineId: string) => void;
}) {
  const { row, expanded, disabled, onActivate, onOpenSalaryLine } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled,
  });
  return (
    <th
      style={PAYROLL_MATRIX_STICKY_EDGE_STYLE}
      className={cn(
        PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
        PAYROLL_MATRIX_STICKY_EDGE_DIVIDER,
        'border-border sticky left-0 z-30 border-r border-b px-2.5 py-1.5 text-left',
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        expanded && PAYROLL_MATRIX_ROW_HEADER_ACTIVE_MARK,
      )}
    >
      <SortableHeaderBody
        setNodeRef={setNodeRef}
        transform={transform}
        transition={transition}
        isDragging={isDragging}
      >
        <MatrixHeaderDragShell
          disabled={disabled}
          dragLabel="Drag to reorder row"
          onActivate={onActivate}
          dragAttributes={attributes}
          dragListeners={listeners}
          onOpenDetail={
            row.kind === 'employee' && row.salaryLineId && onOpenSalaryLine
              ? () => onOpenSalaryLine(row.salaryLineId!)
              : undefined
          }
          detailAriaLabel={
            row.kind === 'employee' ? `Open salary detail for ${row.primary}` : undefined
          }
        >
          <p className={MATRIX_PRIMARY_NAME_CLASS}>
            {row.pinned ? '📌 ' : ''}
            {row.primary}
          </p>
          {row.kind === 'employee' ? (
            row.employeeAmounts ? (
              <MatrixEmployeeAmountStack amounts={row.employeeAmounts} />
            ) : (
              <>
                <MatrixLabeledAmount label="Salary" value={row.secondary} />
                <MatrixLabeledAmount label="Bonus" value={row.meta} />
              </>
            )
          ) : (
            <>
              <MatrixLabeledAmount label="Remaining" value={row.meta} />
              {row.funding ? <MatrixLabeledAmount label="Avail" value={row.funding} /> : null}
            </>
          )}
        </MatrixHeaderDragShell>
      </SortableHeaderBody>
    </th>
  );
}
