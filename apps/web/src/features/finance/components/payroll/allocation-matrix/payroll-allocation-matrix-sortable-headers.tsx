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
import { GripVertical } from 'lucide-react';
import {
  PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
  PAYROLL_MATRIX_DATA_COL_WIDTH,
  PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL,
  PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE,
  PAYROLL_MATRIX_STICKY_HEADER_BG,
  PAYROLL_MATRIX_STICKY_HEADER_SHADOW,
  PAYROLL_MATRIX_TABLE_CLASS,
} from '@/features/finance/constants/payroll-allocation-matrix-layout';
import { cn } from '@/lib/utils';

export type MatrixHeaderKind = 'employee' | 'order';

export type MatrixHeaderColumn = {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
  funding: string | null;
  pinned: boolean;
  kind: MatrixHeaderKind;
};

export type MatrixRowHeader = {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
  funding: string | null;
  pinned: boolean;
  kind: MatrixHeaderKind;
};

const MATRIX_PRIMARY_NAME_CLASS =
  'block truncate text-sm font-semibold tracking-tight text-foreground leading-snug';

function MatrixLabeledAmount({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <p
      className={cn(
        'text-[10px] leading-tight font-normal',
        active ? PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_LABEL : 'text-muted-foreground',
      )}
    >
      <span>{label} </span>
      <span
        className={cn(
          'font-normal tabular-nums',
          active ? PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE : 'text-foreground',
        )}
      >
        {value}
      </span>
    </p>
  );
}

function MatrixHeaderDragShell({
  disabled,
  dragLabel,
  onActivate,
  dragAttributes,
  dragListeners,
  children,
}: {
  disabled: boolean;
  dragLabel: string;
  onActivate: () => void;
  dragAttributes: DraggableAttributes;
  dragListeners: SyntheticListenerMap | undefined;
  children: ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="hover:text-primary w-full min-w-0 overflow-hidden pr-5 text-left"
        onClick={onActivate}
      >
        {children}
      </button>
      {!disabled ? (
        <button
          type="button"
          className={cn(
            'text-muted-foreground hover:text-foreground absolute top-1 right-1 z-10 rounded p-0.5',
            'cursor-grab opacity-0 transition-opacity active:cursor-grabbing',
            'pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100',
            'focus-visible:pointer-events-auto focus-visible:opacity-100',
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
        <thead>
          <tr>
            <th
              className={cn(
                PAYROLL_MATRIX_STICKY_HEADER_BG,
                PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
                PAYROLL_MATRIX_STICKY_HEADER_SHADOW,
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
                  />
                  {activeColumnId === col.id ? renderAfterColumn?.(col.id) : null}
                </Fragment>
              ))}
            </SortableContext>
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
                  />
                  {children(row.id)}
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
}) {
  const { col, expanded, disabled, onActivate } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        PAYROLL_MATRIX_COLUMN_HEADER_STICKY,
        PAYROLL_MATRIX_DATA_COL_WIDTH,
        'border-border border-r border-b px-2 py-2 text-left align-bottom',
        expanded && PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
        isDragging && 'opacity-70',
      )}
    >
      <MatrixHeaderDragShell
        disabled={disabled}
        dragLabel="Drag to reorder column"
        onActivate={onActivate}
        dragAttributes={attributes}
        dragListeners={listeners}
      >
        <p
          className={cn(
            MATRIX_PRIMARY_NAME_CLASS,
            expanded && PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE,
          )}
        >
          {col.pinned ? '📌 ' : ''}
          {col.primary}
        </p>
        {col.kind === 'employee' ? (
          <>
            {col.secondary ? (
              <MatrixLabeledAmount label="Role" value={col.secondary} active={expanded} />
            ) : null}
            <MatrixLabeledAmount label="Bonus" value={col.meta} active={expanded} />
          </>
        ) : (
          <>
            <MatrixLabeledAmount label="Remaining" value={col.meta} active={expanded} />
            {col.funding ? (
              <MatrixLabeledAmount label="Avail" value={col.funding} active={expanded} />
            ) : null}
          </>
        )}
      </MatrixHeaderDragShell>
    </th>
  );
}

function SortableMatrixRowHeader(props: {
  row: MatrixRowHeader;
  expanded: boolean;
  disabled: boolean;
  onActivate: () => void;
}) {
  const { row, expanded, disabled, onActivate } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        PAYROLL_MATRIX_STICKY_HEADER_BG,
        PAYROLL_MATRIX_STICKY_EDGE_WIDTH,
        PAYROLL_MATRIX_STICKY_HEADER_SHADOW,
        'border-border sticky left-0 z-30 border-r border-b px-3 py-2.5 text-left',
        expanded && PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_BG,
        isDragging && 'opacity-70',
      )}
    >
      <MatrixHeaderDragShell
        disabled={disabled}
        dragLabel="Drag to reorder row"
        onActivate={onActivate}
        dragAttributes={attributes}
        dragListeners={listeners}
      >
        <p
          className={cn(
            MATRIX_PRIMARY_NAME_CLASS,
            expanded && PAYROLL_MATRIX_COLUMN_HEADER_ACTIVE_TITLE,
          )}
        >
          {row.pinned ? '📌 ' : ''}
          {row.primary}
        </p>
        {row.kind === 'employee' ? (
          <>
            <MatrixLabeledAmount label="Salary" value={row.secondary} active={expanded} />
            <MatrixLabeledAmount label="Bonus" value={row.meta} active={expanded} />
          </>
        ) : (
          <>
            <MatrixLabeledAmount label="Remaining" value={row.meta} active={expanded} />
            {row.funding ? (
              <MatrixLabeledAmount label="Avail" value={row.funding} active={expanded} />
            ) : null}
          </>
        )}
      </MatrixHeaderDragShell>
    </th>
  );
}
