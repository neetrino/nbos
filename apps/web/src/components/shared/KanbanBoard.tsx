'use client';

import { Fragment, useState, useCallback, useRef, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanColorPicker } from './kanban/KanbanColorPicker';
import { KanbanColumnHeader } from './kanban/KanbanColumnHeader';
import {
  KanbanColumnInsertPlaceholder,
  KanbanInsertPlaceholderAfterList,
  KanbanInsertPlaceholderBeforeItem,
} from './kanban/KanbanColumnInsertPlaceholder';
import {
  KANBAN_CARD_ROW_DATA_ATTR,
  KANBAN_COLUMN_DROP_ZONE_DATA_ATTR,
  KANBAN_COLUMN_LIST_DATA_ATTR,
} from './kanban/kanban-insert-index';
import { KANBAN_HTML5_DRAG_IGNORE_POINTER_CLASS } from './kanban/kanban-html5-drag';
import { KANBAN_COLUMN_LEFT_RULE_CLASS } from './kanban/kanban-column-surface';
import { KanbanTerminalDropBar } from './kanban/KanbanTerminalDropBar';
import { KanbanColumnQuickCreate } from './kanban/KanbanColumnQuickCreate';
import { KanbanColumnLoadMore } from './kanban/KanbanColumnLoadMore';
import { KanbanScrollEdgeControls } from './kanban/KanbanScrollEdgeControls';
import { KANBAN_BOARD_SCROLL_CLASS } from './kanban/kanban-scroll-classes';
import { useKanbanHorizontalScroll } from './kanban/use-kanban-horizontal-scroll';
import { useKanbanHtml5Drag } from './kanban/use-kanban-html5-drag';
import {
  EDGE_ZONE_WIDTH,
  KANBAN_CARD_MOVED_HIGHLIGHT_MS,
  KANBAN_COLUMN_X_MARGIN_TOTAL_PX,
  COLOR_PALETTE,
  contrastText,
  type KanbanBoardProps,
} from './kanban/kanban.types';

export type { KanbanColumn } from './kanban/kanban.types';

export function KanbanBoard<T>({
  columns,
  renderCard,
  renderColumnHeader,
  columnQuickCreate,
  onMove,
  onReorderWithinColumn,
  getItemId,
  columnWidth = 280,
  emptyMessage = 'No items',
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onAddItemInColumn,
  addButtonLabel = 'Quick',
  terminalDropZones,
  onColumnLoadMore,
}: KanbanBoardProps<T>) {
  const editable = !!(onAddColumn || onRenameColumn || onDeleteColumn);

  const resolvedQuickCreate =
    columnQuickCreate ??
    (onAddItemInColumn
      ? {
          isEnabled: () => true,
          buttonLabel: addButtonLabel.replace(/^\+\s*/, ''),
          onOpenDialog: onAddItemInColumn,
        }
      : undefined);

  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set());
  const prevItemsRef = useRef<Map<string, string>>(new Map());

  const {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    isMobileViewport,
    resolvedColumnWidth,
    startAutoScroll,
    stopAutoScroll,
  } = useKanbanHorizontalScroll({
    columnWidth,
    layoutKey: columns.length,
  });

  const handleDragAutoScroll = useCallback(
    (clientX: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (clientX < rect.left + EDGE_ZONE_WIDTH) {
        startAutoScroll('left');
        return;
      }
      if (clientX > rect.right - EDGE_ZONE_WIDTH) {
        startAutoScroll('right');
        return;
      }
      stopAutoScroll();
    },
    [scrollRef, startAutoScroll, stopAutoScroll],
  );

  const {
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
  } = useKanbanHtml5Drag({
    columns,
    getItemId,
    onMove,
    onReorderWithinColumn,
    onDragAutoScroll: handleDragAutoScroll,
    stopAutoScroll,
  });

  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [showAddPicker, setShowAddPicker] = useState(false);

  /* ── Move animation tracking ── */
  useEffect(() => {
    const currentMap = new Map<string, string>();
    const movedIds = new Set<string>();
    for (const col of columns) {
      for (const item of col.items) {
        const id = getItemId(item);
        currentMap.set(id, col.key);
        const prev = prevItemsRef.current.get(id);
        if (prev && prev !== col.key) movedIds.add(id);
      }
    }
    prevItemsRef.current = currentMap;
    if (movedIds.size > 0) {
      const showTimer = window.setTimeout(() => setRecentlyMoved(movedIds), 0);
      const clearTimer = window.setTimeout(
        () => setRecentlyMoved(new Set()),
        KANBAN_CARD_MOVED_HIGHLIGHT_MS,
      );
      return () => {
        window.clearTimeout(showTimer);
        window.clearTimeout(clearTimer);
      };
    }
  }, [columns, getItemId]);

  /* ── Add column ── */
  const startAdd = (afterKey: string) => {
    setAddingAfter(afterKey);
    setNewTitle('');
    setNewColor(COLOR_PALETTE[columns.length % COLOR_PALETTE.length] ?? '#3B82F6');
    setShowAddPicker(false);
  };
  const confirmAdd = () => {
    if (newTitle.trim() && onAddColumn)
      onAddColumn(newTitle.trim(), newColor, addingAfter ?? undefined);
    setAddingAfter(null);
    setNewTitle('');
    setShowAddPicker(false);
  };
  const cancelAdd = () => {
    setAddingAfter(null);
    setNewTitle('');
    setShowAddPicker(false);
  };

  /* ── "+" button between columns ── */
  const addBetweenBtn = (afterKey: string) =>
    editable && onAddColumn && addingAfter === null ? (
      <div
        className={cn(
          'group/add flex h-full flex-shrink-0 items-start pt-1',
          dragItem && KANBAN_HTML5_DRAG_IGNORE_POINTER_CLASS,
        )}
      >
        <button
          onClick={() => startAdd(afterKey)}
          className="border-primary/0 bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full opacity-0 shadow-sm transition-all group-hover/add:opacity-100"
          title="Add stage here"
        >
          <Plus size={14} />
        </button>
      </div>
    ) : null;

  /* ── Inline new-column form ── */
  const addForm = (
    <div
      className="mx-1 flex h-full flex-shrink-0 flex-col pt-0"
      style={{ width: resolvedColumnWidth }}
    >
      <div className="relative flex w-full items-center gap-1">
        <button
          onClick={() => setShowAddPicker(!showAddPicker)}
          className="border-border h-8 w-8 shrink-0 rounded-lg border"
          style={{ backgroundColor: newColor }}
          title="Pick color"
        />
        {showAddPicker && (
          <KanbanColorPicker
            value={newColor}
            onChange={(c) => {
              setNewColor(c);
              setShowAddPicker(false);
            }}
          />
        )}
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmAdd();
            if (e.key === 'Escape') cancelAdd();
          }}
          placeholder="Stage name..."
          className="h-8 flex-1 rounded-lg px-3 text-sm font-bold outline-none"
          style={{ backgroundColor: newColor, color: contrastText(newColor) }}
          autoFocus
        />
        <button onClick={confirmAdd} className="hover:bg-muted rounded p-0.5">
          <Check size={14} className="text-green-500" />
        </button>
        <button onClick={cancelAdd} className="hover:bg-muted rounded p-0.5">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>
      <div
        className="mt-3 w-full flex-1 rounded-xl border border-dashed p-6 text-center"
        style={{ borderColor: newColor + '40' }}
      >
        <p className="text-muted-foreground text-xs">New stage</p>
      </div>
    </div>
  );

  return (
    <div
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col"
      onDragOver={handleBoardDragOver}
      onDrop={handleBoardDrop}
    >
      <KanbanScrollEdgeControls
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        isMobile={isMobileViewport}
        pointerEnabled={!dragItem}
        onHoverStart={startAutoScroll}
        onHoverEnd={stopAutoScroll}
      />

      <div
        ref={scrollRef}
        className={cn(KANBAN_BOARD_SCROLL_CLASS, dragItem && terminalDropZones?.length && 'pb-28')}
      >
        <div
          className="flex h-full gap-0"
          style={{
            minWidth: `${(columns.length + (editable ? 1 : 0)) * (resolvedColumnWidth + KANBAN_COLUMN_X_MARGIN_TOTAL_PX)}px`,
          }}
        >
          {columns.map((column, idx) => {
            const isDropTarget = dropTarget === column.key && dragItem !== null;
            const canReorderInColumn = Boolean(onReorderWithinColumn);
            const showDropPreview =
              isDropTarget &&
              (dragItem.fromColumn !== column.key ||
                (dragItem.fromColumn === column.key && canReorderInColumn));
            const insertIndex =
              showDropPreview && dropInsert?.columnKey === column.key ? dropInsert.index : null;

            return (
              <div key={column.key} className="flex h-full">
                {/* "+" between columns (before this column, except first) */}
                {idx > 0 &&
                  addingAfter !== columns[idx - 1]?.key &&
                  addBetweenBtn(columns[idx - 1]!.key)}

                {/* Inline form if adding after the previous column */}
                {idx > 0 && addingAfter === columns[idx - 1]?.key && addForm}

                {/* Column */}
                <div
                  className="relative mx-2 flex h-full flex-shrink-0 flex-col"
                  style={{ width: resolvedColumnWidth }}
                  {...{ [KANBAN_COLUMN_DROP_ZONE_DATA_ATTR]: column.key }}
                  onDragOver={(event) => handleColumnDragOver(event, column.key)}
                  onDrop={(event) => handleColumnDrop(event, column.key)}
                >
                  {idx > 0 ? <div className={KANBAN_COLUMN_LEFT_RULE_CLASS} aria-hidden /> : null}
                  <div
                    className={cn(
                      'group/header mb-3 shrink-0 space-y-2',
                      dragItem && KANBAN_HTML5_DRAG_IGNORE_POINTER_CLASS,
                    )}
                  >
                    <KanbanColumnHeader
                      column={column}
                      editable={editable}
                      onRenameColumn={onRenameColumn}
                      onDeleteColumn={onDeleteColumn}
                    />
                    {renderColumnHeader?.(column)}
                    {resolvedQuickCreate ? (
                      <KanbanColumnQuickCreate column={column} config={resolvedQuickCreate} />
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div
                      className="flex min-h-full min-w-0 flex-col space-y-3 pb-3"
                      {...{ [KANBAN_COLUMN_LIST_DATA_ATTR]: column.key }}
                    >
                      <KanbanColumnInsertPlaceholder
                        insertIndex={insertIndex}
                        itemCount={column.items.length}
                        isDropTarget={showDropPreview}
                        heightPx={dragCardHeightPx}
                      />
                      {column.items.map((item, itemIdx) => {
                        const id = getItemId(item);
                        return (
                          <Fragment key={id}>
                            <KanbanInsertPlaceholderBeforeItem
                              insertIndex={insertIndex}
                              itemIdx={itemIdx}
                              isDropTarget={showDropPreview}
                              heightPx={dragCardHeightPx}
                            />
                            <div
                              draggable={!isMobileViewport}
                              onDragStart={
                                isMobileViewport
                                  ? undefined
                                  : (event) => handleDragStart(id, column.key, event)
                              }
                              onDragEnd={isMobileViewport ? undefined : handleDragEnd}
                              {...{ [KANBAN_CARD_ROW_DATA_ATTR]: true }}
                              data-item-id={id}
                              className={cn(
                                'min-w-0 transition-opacity duration-150',
                                isMobileViewport
                                  ? 'cursor-pointer'
                                  : 'cursor-grab active:cursor-grabbing',
                                dragItem?.id === id && 'scale-[0.97] opacity-50',
                                dragItem &&
                                  dragItem.id !== id &&
                                  KANBAN_HTML5_DRAG_IGNORE_POINTER_CLASS,
                                recentlyMoved.has(id) && 'animate-in fade-in duration-150',
                              )}
                            >
                              {renderCard(item, column.key)}
                            </div>
                          </Fragment>
                        );
                      })}
                      <KanbanInsertPlaceholderAfterList
                        insertIndex={insertIndex}
                        itemCount={column.items.length}
                        isDropTarget={showDropPreview}
                        heightPx={dragCardHeightPx}
                      />
                      {column.items.length === 0 && !showDropPreview ? (
                        <div className="border-border rounded-xl border border-dashed p-6 text-center">
                          <p className="text-muted-foreground text-xs">{emptyMessage}</p>
                        </div>
                      ) : null}
                      {showDropPreview ? (
                        <div className="min-h-[3rem] flex-1 shrink-0" aria-hidden />
                      ) : null}
                      <KanbanColumnLoadMore
                        hasMore={column.hasMore}
                        loadingMore={column.loadingMore}
                        onLoadMore={
                          onColumnLoadMore ? () => onColumnLoadMore(column.key) : undefined
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+" after the last column */}
          {columns.length > 0 &&
            addingAfter !== columns[columns.length - 1]!.key &&
            addBetweenBtn(columns[columns.length - 1]!.key)}

          {/* Inline form if adding after the last column */}
          {columns.length > 0 && addingAfter === columns[columns.length - 1]!.key && addForm}

          {/* Empty board: single "+" */}
          {columns.length === 0 && editable && onAddColumn && addingAfter === null && (
            <div className="flex h-full flex-shrink-0 items-start pt-1">
              <button
                onClick={() => startAdd('__end')}
                className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full shadow-sm"
                title="Add first stage"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          {columns.length === 0 && addingAfter === '__end' && addForm}
        </div>
      </div>

      {dragItem && terminalDropZones && terminalDropZones.length > 0 ? (
        <KanbanTerminalDropBar
          zones={terminalDropZones}
          activeZoneKey={terminalDropTarget}
          onDragOver={handleTerminalDragOver}
          onDragLeave={handleTerminalDragLeave}
          onDrop={handleTerminalDrop}
        />
      ) : null}
    </div>
  );
}
