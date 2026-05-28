'use client';

import type { ReactNode } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
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
  'text-sm font-semibold tracking-tight text-foreground line-clamp-2 leading-snug';

function MatrixLabeledAmount({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-muted-foreground text-[10px] leading-tight font-normal">
      <span>{label} </span>
      <span className="text-foreground font-normal tabular-nums">{value}</span>
    </p>
  );
}

export function PayrollAllocationMatrixTableShell(props: {
  columns: MatrixHeaderColumn[];
  rows: MatrixRowHeader[];
  cornerLabel: string;
  activeColumnId: string | null;
  activeRowId: string | null;
  disabled: boolean;
  onActivateColumn: (id: string | null) => void;
  onActivateRow: (id: string | null) => void;
  onReorderColumns: (orderedIds: string[]) => void;
  onReorderRows: (orderedIds: string[]) => void;
  children: (rowId: string) => ReactNode;
}) {
  const {
    columns,
    rows,
    cornerLabel,
    activeColumnId,
    activeRowId,
    disabled,
    onActivateColumn,
    onActivateRow,
    onReorderColumns,
    onReorderRows,
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
      <table className="w-max min-w-full border-collapse text-xs">
        <thead className="bg-card sticky top-0 z-20">
          <tr>
            <th className="bg-card border-border sticky left-0 z-30 min-w-[12.5rem] border-r border-b px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">
              {cornerLabel}
            </th>
            <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
              {columns.map((col) => (
                <SortableMatrixColumnHeader
                  key={col.id}
                  col={col}
                  active={activeColumnId === col.id}
                  disabled={disabled}
                  onActivate={() => onActivateColumn(activeColumnId === col.id ? null : col.id)}
                />
              ))}
            </SortableContext>
          </tr>
        </thead>
        <tbody>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {rows.map((row) => (
              <tr key={row.id}>
                <SortableMatrixRowHeader
                  row={row}
                  active={activeRowId === row.id}
                  disabled={disabled}
                  onActivate={() => onActivateRow(activeRowId === row.id ? null : row.id)}
                />
                {children(row.id)}
              </tr>
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}

function SortableMatrixColumnHeader(props: {
  col: MatrixHeaderColumn;
  active: boolean;
  disabled: boolean;
  onActivate: () => void;
}) {
  const { col, active, disabled, onActivate } = props;
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
        'border-border min-w-[7.5rem] border-r border-b px-2 py-2 text-left align-bottom',
        active && 'bg-primary/10',
        isDragging && 'opacity-70',
      )}
    >
      <div className="flex gap-1">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder column"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} aria-hidden />
        </button>
        <button
          type="button"
          className="hover:text-primary min-w-0 flex-1 text-left"
          onClick={onActivate}
        >
          <p className={MATRIX_PRIMARY_NAME_CLASS}>
            {col.pinned ? '📌 ' : ''}
            {col.primary}
          </p>
          {col.kind === 'employee' ? (
            <>
              {col.secondary ? <MatrixLabeledAmount label="Role" value={col.secondary} /> : null}
              <MatrixLabeledAmount label="Bonus" value={col.meta} />
            </>
          ) : (
            <>
              <MatrixLabeledAmount label="Remaining" value={col.meta} />
              {col.funding ? <MatrixLabeledAmount label="Avail" value={col.funding} /> : null}
            </>
          )}
        </button>
      </div>
    </th>
  );
}

function SortableMatrixRowHeader(props: {
  row: MatrixRowHeader;
  active: boolean;
  disabled: boolean;
  onActivate: () => void;
}) {
  const { row, active, disabled, onActivate } = props;
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
        'bg-card border-border sticky left-0 z-10 min-w-[12.5rem] border-r border-b px-3 py-2.5 text-left',
        row.kind === 'employee' && 'bg-muted/20',
        active && 'bg-primary/10',
        isDragging && 'opacity-70',
      )}
    >
      <div className="flex gap-1">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder row"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} aria-hidden />
        </button>
        <button
          type="button"
          className="hover:text-primary min-w-0 flex-1 text-left"
          onClick={onActivate}
        >
          <p className={MATRIX_PRIMARY_NAME_CLASS}>
            {row.pinned ? '📌 ' : ''}
            {row.primary}
          </p>
          {row.kind === 'employee' ? (
            <>
              <MatrixLabeledAmount label="Salary" value={row.secondary} />
              <MatrixLabeledAmount label="Bonus" value={row.meta} />
            </>
          ) : (
            <>
              <MatrixLabeledAmount label="Remaining" value={row.meta} />
              {row.funding ? <MatrixLabeledAmount label="Avail" value={row.funding} /> : null}
            </>
          )}
        </button>
      </div>
    </th>
  );
}
