'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanColorPicker } from './kanban/KanbanColorPicker';
import { KanbanColumnHeader } from './kanban/KanbanColumnHeader';
import {
  SCROLL_SPEED,
  EDGE_ZONE_WIDTH,
  COLOR_PALETTE,
  contrastText,
  type KanbanBoardProps,
} from './kanban/kanban.types';

export type { KanbanColumn } from './kanban/kanban.types';

export function KanbanBoard<T>({
  columns,
  renderCard,
  renderColumnHeader,
  onMove,
  getItemId,
  columnWidth = 280,
  emptyMessage = 'No items',
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onAddItemInColumn,
  addButtonLabel = 'Quick',
}: KanbanBoardProps<T>) {
  const editable = !!(onAddColumn || onRenameColumn || onDeleteColumn);

  const [dragItem, setDragItem] = useState<{ id: string; fromColumn: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set());
  const prevItemsRef = useRef<Map<string, string>>(new Map());

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const autoScrollDir = useRef<'left' | 'right' | null>(null);
  const rafId = useRef<number>(0);

  const [addingAfter, setAddingAfter] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [showAddPicker, setShowAddPicker] = useState(false);

  /* ── Scroll state ── */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, columns]);

  const startAutoScroll = useCallback((dir: 'left' | 'right') => {
    autoScrollDir.current = dir;
    const tick = () => {
      const el = scrollRef.current;
      if (!el || !autoScrollDir.current) return;
      el.scrollLeft += autoScrollDir.current === 'left' ? -SCROLL_SPEED : SCROLL_SPEED;
      rafId.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoScrollDir.current = null;
    cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

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
      setRecentlyMoved(movedIds);
      const t = setTimeout(() => setRecentlyMoved(new Set()), 350);
      return () => clearTimeout(t);
    }
  }, [columns, getItemId]);

  /* ── Drag handlers ── */
  const handleDragStart = useCallback(
    (id: string, col: string) => setDragItem({ id, fromColumn: col }),
    [],
  );
  const handleDragOver = useCallback((e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDropTarget(col);
  }, []);
  const handleDragLeave = useCallback(() => setDropTarget(null), []);
  const handleDrop = useCallback(
    (col: string) => {
      if (dragItem && dragItem.fromColumn !== col) onMove?.(dragItem.id, dragItem.fromColumn, col);
      setDragItem(null);
      setDropTarget(null);
    },
    [dragItem, onMove],
  );

  /* ── Add column ── */
  const startAdd = (afterKey: string) => {
    setAddingAfter(afterKey);
    setNewTitle('');
    setNewColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] ?? '#3B82F6');
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

  /* ── Scroll edge zones ── */
  const edgeZone = (side: 'left' | 'right', canScroll: boolean) => (
    <div
      onMouseEnter={() => canScroll && startAutoScroll(side)}
      onMouseLeave={stopAutoScroll}
      className={cn(
        'absolute top-0 z-20 flex h-full items-center',
        side === 'left'
          ? 'from-background/80 left-0 bg-gradient-to-r'
          : 'from-background/80 right-0 bg-gradient-to-l',
        'to-transparent transition-opacity duration-200',
        canScroll ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      style={{ width: EDGE_ZONE_WIDTH }}
    >
      <div className="flex h-full w-full items-center justify-center">
        <div className="bg-background/80 border-border flex h-7 w-7 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm">
          {side === 'left' ? (
            <ChevronLeft size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );

  /* ── "+" button between columns ── */
  const addBetweenBtn = (afterKey: string) =>
    editable && onAddColumn && addingAfter === null ? (
      <div className="group/add flex h-full flex-shrink-0 items-start pt-1">
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
    <div className="mx-1 flex h-full flex-shrink-0 flex-col pt-0" style={{ width: columnWidth }}>
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
    <div className="relative flex h-full flex-col">
      {edgeZone('left', canScrollLeft)}
      {edgeZone('right', canScrollRight)}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div
          className="flex h-full gap-0"
          style={{ minWidth: `${(columns.length + (editable ? 1 : 0)) * (columnWidth + 16)}px` }}
        >
          {columns.map((column, idx) => (
            <div key={column.key} className="flex h-full">
              {/* "+" between columns (before this column, except first) */}
              {idx > 0 &&
                addingAfter !== columns[idx - 1]?.key &&
                addBetweenBtn(columns[idx - 1]!.key)}

              {/* Inline form if adding after the previous column */}
              {idx > 0 && addingAfter === columns[idx - 1]?.key && addForm}

              {/* Column */}
              <div
                className={cn(
                  'mx-2 flex h-full flex-shrink-0 flex-col rounded-xl transition-colors duration-200',
                  dropTarget === column.key && 'bg-accent/10 ring-accent/20 ring-2 ring-inset',
                )}
                style={{ width: columnWidth }}
                onDragOver={(e) => handleDragOver(e, column.key)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(column.key)}
              >
                <div className="group/header mb-3 shrink-0 space-y-2">
                  <KanbanColumnHeader
                    column={column}
                    editable={editable}
                    onRenameColumn={onRenameColumn}
                    onDeleteColumn={onDeleteColumn}
                  />
                  {renderColumnHeader?.(column)}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-3">
                    {onAddItemInColumn && (
                      <div className="group/add-btn flex justify-center">
                        <button
                          type="button"
                          onClick={() => onAddItemInColumn(column.key)}
                          className="border-border hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 min-w-[2rem] items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 text-xs font-medium transition-colors"
                        >
                          <Plus size={14} />
                          <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity] duration-200 group-hover/add-btn:max-w-[5rem] group-hover/add-btn:opacity-100">
                            {addButtonLabel}
                          </span>
                        </button>
                      </div>
                    )}
                    {column.items.map((item) => {
                      const id = getItemId(item);
                      return (
                        <div
                          key={id}
                          draggable
                          onDragStart={() => handleDragStart(id, column.key)}
                          className={cn(
                            'cursor-grab transition-all duration-300 active:cursor-grabbing',
                            dragItem?.id === id && 'scale-[0.97] opacity-50',
                            recentlyMoved.has(id) &&
                              'animate-in fade-in slide-in-from-left-3 duration-300',
                          )}
                        >
                          {renderCard(item, column.key)}
                        </div>
                      );
                    })}
                    {column.items.length === 0 && (
                      <div className="border-border rounded-xl border border-dashed p-6 text-center">
                        <p className="text-muted-foreground text-xs">{emptyMessage}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

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
    </div>
  );
}
