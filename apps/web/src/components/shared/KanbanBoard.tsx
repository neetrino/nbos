'use client';

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KanbanColumn<T> {
  key: string;
  label: string;
  color: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnKey: string) => ReactNode;
  onMove?: (itemId: string, fromColumn: string, toColumn: string) => void;
  getItemId: (item: T) => string;
  columnWidth?: number;
  emptyMessage?: string;
}

const SCROLL_SPEED = 6;
const EDGE_ZONE_WIDTH = 48;

export function KanbanBoard<T>({
  columns,
  renderCard,
  onMove,
  getItemId,
  columnWidth = 280,
  emptyMessage = 'No items',
}: KanbanBoardProps<T>) {
  const [dragItem, setDragItem] = useState<{ id: string; fromColumn: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [recentlyMoved, setRecentlyMoved] = useState<Set<string>>(new Set());
  const prevItemsRef = useRef<Map<string, string>>(new Map());

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const autoScrollDir = useRef<'left' | 'right' | null>(null);
  const rafId = useRef<number>(0);

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

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    autoScrollDir.current = direction;

    const tick = () => {
      const el = scrollRef.current;
      if (!el || !autoScrollDir.current) return;

      const delta = autoScrollDir.current === 'left' ? -SCROLL_SPEED : SCROLL_SPEED;
      el.scrollLeft += delta;
      rafId.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoScroll = useCallback(() => {
    autoScrollDir.current = null;
    cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  useEffect(() => {
    const currentMap = new Map<string, string>();
    const movedIds = new Set<string>();

    for (const col of columns) {
      for (const item of col.items) {
        const id = getItemId(item);
        currentMap.set(id, col.key);
        const prevCol = prevItemsRef.current.get(id);
        if (prevCol && prevCol !== col.key) {
          movedIds.add(id);
        }
      }
    }

    prevItemsRef.current = currentMap;

    if (movedIds.size > 0) {
      setRecentlyMoved(movedIds);
      const timer = setTimeout(() => setRecentlyMoved(new Set()), 350);
      return () => clearTimeout(timer);
    }
  }, [columns, getItemId]);

  const handleDragStart = useCallback((itemId: string, columnKey: string) => {
    setDragItem({ id: itemId, fromColumn: columnKey });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDropTarget(columnKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (columnKey: string) => {
      if (dragItem && dragItem.fromColumn !== columnKey) {
        onMove?.(dragItem.id, dragItem.fromColumn, columnKey);
      }
      setDragItem(null);
      setDropTarget(null);
    },
    [dragItem, onMove],
  );

  return (
    <div className="relative flex h-full flex-col">
      {/* Left edge hover zone — auto-scrolls left on mouse enter */}
      <div
        onMouseEnter={() => canScrollLeft && startAutoScroll('left')}
        onMouseLeave={stopAutoScroll}
        className={cn(
          'absolute top-0 left-0 z-20 flex h-full items-center',
          'from-background/80 bg-gradient-to-r to-transparent',
          'transition-opacity duration-200',
          canScrollLeft ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ width: EDGE_ZONE_WIDTH }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="bg-background/80 border-border flex h-7 w-7 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm">
            <ChevronLeft size={14} className="text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Right edge hover zone — auto-scrolls right on mouse enter */}
      <div
        onMouseEnter={() => canScrollRight && startAutoScroll('right')}
        onMouseLeave={stopAutoScroll}
        className={cn(
          'absolute top-0 right-0 z-20 flex h-full items-center',
          'from-background/80 bg-gradient-to-l to-transparent',
          'transition-opacity duration-200',
          canScrollRight ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{ width: EDGE_ZONE_WIDTH }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="bg-background/80 border-border flex h-7 w-7 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm">
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div
          className="flex h-full gap-4"
          style={{ minWidth: `${columns.length * (columnWidth + 16)}px` }}
        >
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                'flex h-full flex-shrink-0 flex-col rounded-xl transition-colors duration-200',
                dropTarget === column.key && 'bg-accent/10 ring-accent/20 ring-2 ring-inset',
              )}
              style={{ width: columnWidth }}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(column.key)}
            >
              <div className="mb-3 flex shrink-0 items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', column.color)} />
                <h3 className="text-foreground text-sm font-semibold">{column.label}</h3>
                <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-2 py-0.5 text-xs font-medium tabular-nums transition-all duration-200">
                  {column.items.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="space-y-3">
                  {column.items.map((item) => {
                    const id = getItemId(item);
                    const isMoved = recentlyMoved.has(id);
                    return (
                      <div
                        key={id}
                        draggable
                        onDragStart={() => handleDragStart(id, column.key)}
                        className={cn(
                          'cursor-grab transition-all duration-300 active:cursor-grabbing',
                          dragItem?.id === id && 'scale-[0.97] opacity-50',
                          isMoved && 'animate-in fade-in slide-in-from-left-3 duration-300',
                        )}
                      >
                        {renderCard(item, column.key)}
                      </div>
                    );
                  })}
                  {column.items.length === 0 && (
                    <div className="border-border rounded-xl border border-dashed p-6 text-center transition-opacity duration-200">
                      <p className="text-muted-foreground text-xs">{emptyMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
