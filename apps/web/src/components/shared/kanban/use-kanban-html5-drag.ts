'use client';

import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { measureKanbanCardRowHeight } from './kanban-drag-metrics';
import {
  allowKanbanHtml5Drop,
  isSameKanbanInsert,
  planKanbanHtml5Drop,
  prepareKanbanHtml5Drag,
  type KanbanHtml5DragItem,
  type KanbanHtml5DropPlan,
  type KanbanHtml5Insert,
} from './kanban-html5-drag';
import { findKanbanColumnList, resolveKanbanInsertIndex } from './kanban-insert-index';

type KanbanHtml5Column<T> = {
  key: string;
  items: T[];
};

type UseKanbanHtml5DragOptions<T> = {
  columns: ReadonlyArray<KanbanHtml5Column<T>>;
  getItemId: (item: T) => string;
  onMove?: (itemId: string, fromColumn: string, toColumn: string, toIndex?: number) => void;
  onReorderWithinColumn?: (itemId: string, columnKey: string, toIndex: number) => void;
  onDragAutoScroll?: (clientX: number) => void;
  stopAutoScroll?: () => void;
};

/**
 * HTML5 kanban drag. Commits from a ref on `drop` or `dragend` so nested
 * cards / buttons / edge chrome cannot swallow the move.
 */
export function useKanbanHtml5Drag<T>({
  columns,
  getItemId,
  onMove,
  onReorderWithinColumn,
  onDragAutoScroll,
  stopAutoScroll,
}: UseKanbanHtml5DragOptions<T>) {
  const [dragItem, setDragItem] = useState<KanbanHtml5DragItem | null>(null);
  const [dragCardHeightPx, setDragCardHeightPx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropInsert, setDropInsert] = useState<KanbanHtml5Insert | null>(null);
  const [terminalDropTarget, setTerminalDropTarget] = useState<string | null>(null);

  const dragItemRef = useRef<KanbanHtml5DragItem | null>(null);
  const dropInsertRef = useRef<KanbanHtml5Insert | null>(null);
  const terminalDropTargetRef = useRef<string | null>(null);
  const committedRef = useRef(false);
  const columnsRef = useRef(columns);
  const getItemIdRef = useRef(getItemId);
  const onMoveRef = useRef(onMove);
  const onReorderRef = useRef(onReorderWithinColumn);
  const onDragAutoScrollRef = useRef(onDragAutoScroll);
  const stopAutoScrollRef = useRef(stopAutoScroll);

  useEffect(() => {
    columnsRef.current = columns;
    getItemIdRef.current = getItemId;
    onMoveRef.current = onMove;
    onReorderRef.current = onReorderWithinColumn;
    onDragAutoScrollRef.current = onDragAutoScroll;
    stopAutoScrollRef.current = stopAutoScroll;
  }, [columns, getItemId, onMove, onReorderWithinColumn, onDragAutoScroll, stopAutoScroll]);

  const clearDragState = useCallback(() => {
    dragItemRef.current = null;
    dropInsertRef.current = null;
    terminalDropTargetRef.current = null;
    setDragItem(null);
    setDragCardHeightPx(null);
    setDropTarget(null);
    setDropInsert(null);
    setTerminalDropTarget(null);
    stopAutoScrollRef.current?.();
  }, []);

  const applyDropPlan = useCallback((plan: KanbanHtml5DropPlan) => {
    if (committedRef.current || plan.kind === 'noop') return;
    committedRef.current = true;
    if (plan.kind === 'move') {
      onMoveRef.current?.(plan.itemId, plan.fromColumn, plan.toColumn, plan.toIndex);
      return;
    }
    onReorderRef.current?.(plan.itemId, plan.columnKey, plan.toIndex);
  }, []);

  const commitColumnDrop = useCallback(
    (columnKey: string, filteredInsert: number) => {
      const item = dragItemRef.current;
      if (!item) return;
      const columnItems =
        columnsRef.current.find((column) => column.key === columnKey)?.items ?? [];
      applyDropPlan(
        planKanbanHtml5Drop({
          dragItem: item,
          toColumn: columnKey,
          filteredInsert,
          columnItems,
          getItemId: getItemIdRef.current,
        }),
      );
    },
    [applyDropPlan],
  );

  const handleDragStart = useCallback(
    (id: string, fromColumn: string, event: DragEvent<HTMLDivElement>) => {
      prepareKanbanHtml5Drag(event.dataTransfer, id);
      committedRef.current = false;
      const next = { id, fromColumn };
      dragItemRef.current = next;
      dropInsertRef.current = null;
      terminalDropTargetRef.current = null;
      setDragCardHeightPx(measureKanbanCardRowHeight(event.currentTarget));
      setDragItem(next);
      setDropTarget(null);
      setDropInsert(null);
      setTerminalDropTarget(null);
    },
    [],
  );

  const handleColumnDragOver = useCallback((event: DragEvent<HTMLElement>, col: string) => {
    event.preventDefault();
    allowKanbanHtml5Drop(event.dataTransfer);
    const item = dragItemRef.current;
    if (!item) return;

    onDragAutoScrollRef.current?.(event.clientX);
    const list = findKanbanColumnList(event.currentTarget);
    if (!list) return;

    const excludeId = item.fromColumn === col ? item.id : undefined;
    const index = resolveKanbanInsertIndex(list, event.clientY, excludeId);
    dropInsertRef.current = { columnKey: col, index };
    terminalDropTargetRef.current = null;
    setTerminalDropTarget((prev) => (prev === null ? prev : null));
    setDropTarget((prev) => (prev === col ? prev : col));
    setDropInsert((prev) =>
      isSameKanbanInsert(prev, col, index) ? prev : { columnKey: col, index },
    );
  }, []);

  const handleColumnDrop = useCallback(
    (event: DragEvent<HTMLElement>, columnKey: string) => {
      event.preventDefault();
      event.stopPropagation();
      const insert = dropInsertRef.current;
      const filteredInsert = insert?.columnKey === columnKey ? insert.index : undefined;
      const fallbackIndex =
        columnsRef.current.find((column) => column.key === columnKey)?.items.length ?? 0;
      commitColumnDrop(columnKey, filteredInsert ?? fallbackIndex);
      clearDragState();
    },
    [clearDragState, commitColumnDrop],
  );

  const handleTerminalDragOver = useCallback((zoneKey: string) => {
    terminalDropTargetRef.current = zoneKey;
    dropInsertRef.current = null;
    setTerminalDropTarget(zoneKey);
    setDropTarget(null);
    setDropInsert(null);
  }, []);

  const handleTerminalDragLeave = useCallback(() => {
    terminalDropTargetRef.current = null;
    setTerminalDropTarget(null);
  }, []);

  const handleTerminalDrop = useCallback(
    (zoneKey: string) => {
      const item = dragItemRef.current;
      if (item && item.fromColumn !== zoneKey) {
        applyDropPlan({
          kind: 'move',
          itemId: item.id,
          fromColumn: item.fromColumn,
          toColumn: zoneKey,
          toIndex: 0,
        });
      }
      clearDragState();
    },
    [applyDropPlan, clearDragState],
  );

  const handleDragEnd = useCallback(() => {
    const item = dragItemRef.current;
    if (!committedRef.current && item) {
      const terminalKey = terminalDropTargetRef.current;
      if (terminalKey && terminalKey !== item.fromColumn) {
        applyDropPlan({
          kind: 'move',
          itemId: item.id,
          fromColumn: item.fromColumn,
          toColumn: terminalKey,
          toIndex: 0,
        });
      } else if (dropInsertRef.current) {
        const insert = dropInsertRef.current;
        commitColumnDrop(insert.columnKey, insert.index);
      }
    }
    committedRef.current = false;
    clearDragState();
  }, [applyDropPlan, clearDragState, commitColumnDrop]);

  const handleBoardDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!dragItemRef.current) return;
    event.preventDefault();
    allowKanbanHtml5Drop(event.dataTransfer);
    onDragAutoScrollRef.current?.(event.clientX);
  }, []);

  const handleBoardDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const terminalKey = terminalDropTargetRef.current;
      if (terminalKey) {
        handleTerminalDrop(terminalKey);
        return;
      }
      const insert = dropInsertRef.current;
      if (insert) commitColumnDrop(insert.columnKey, insert.index);
      clearDragState();
    },
    [clearDragState, commitColumnDrop, handleTerminalDrop],
  );

  return {
    dragItem,
    dragCardHeightPx,
    dropTarget,
    dropInsert,
    terminalDropTarget,
    handleDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    handleTerminalDragOver,
    handleTerminalDragLeave,
    handleTerminalDrop,
    handleDragEnd,
    handleBoardDragOver,
    handleBoardDrop,
  };
}
