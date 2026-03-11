'use client';

import { useState, useCallback, type ReactNode } from 'react';
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
              'flex-shrink-0 rounded-xl transition-colors',
              dropTarget === column.key && 'bg-accent/5',
            )}
            style={{ width: columnWidth }}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(column.key)}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', column.color)} />
              <h3 className="text-foreground text-sm font-semibold">{column.label}</h3>
              <span className="bg-secondary text-muted-foreground ml-auto rounded-md px-2 py-0.5 text-xs font-medium">
                {column.items.length}
              </span>
            </div>

            <div className="space-y-3">
              {column.items.map((item) => (
                <div
                  key={getItemId(item)}
                  draggable
                  onDragStart={() => handleDragStart(getItemId(item), column.key)}
                  className={cn(
                    'cursor-grab active:cursor-grabbing',
                    dragItem?.id === getItemId(item) && 'opacity-50',
                  )}
                >
                  {renderCard(item, column.key)}
                </div>
              ))}
              {column.items.length === 0 && (
                <div className="border-border rounded-xl border border-dashed p-6 text-center">
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
