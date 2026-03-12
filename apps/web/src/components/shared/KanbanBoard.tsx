'use client';

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
    <ScrollArea className="w-full">
      <div
        className="flex gap-4 pb-4"
        style={{ minWidth: `${columns.length * (columnWidth + 16)}px` }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              'flex-shrink-0 rounded-xl transition-colors duration-200',
              dropTarget === column.key && 'bg-accent/10 ring-accent/20 ring-2 ring-inset',
            )}
            style={{ width: columnWidth }}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(column.key)}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', column.color)} />
              <h3 className="text-foreground text-sm font-semibold">{column.label}</h3>
              <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-2 py-0.5 text-xs font-medium tabular-nums transition-all duration-200">
                {column.items.length}
              </span>
            </div>

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
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
