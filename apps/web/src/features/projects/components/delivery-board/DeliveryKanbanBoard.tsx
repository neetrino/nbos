'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import {
  deliveryKanbanCardId,
  deliveryKanbanColId,
  parseDeliveryKanbanCardItemKey,
  parseDeliveryKanbanColId,
} from './delivery-kanban-ids';
import type { BoardAction, DeliveryActiveStage } from './project-delivery-board-actions';
import {
  ACTIVE_DELIVERY_STAGES,
  DELIVERY_STAGE_LABELS,
  getItemId,
  getItemKey,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';

const POINTER_ACTIVATION_PX = 8;
const KANBAN_COLUMN_WIDTH_CLASS = 'w-[280px]';

interface DeliveryKanbanBoardProps {
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
  onMoveToStage: (item: DeliveryBoardItem, target: DeliveryActiveStage) => void;
}

export function DeliveryKanbanBoard({
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
  onOpenDetails,
  onMoveToStage,
}: DeliveryKanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<DeliveryBoardItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: POINTER_ACTIVATION_PX } }),
    useSensor(KeyboardSensor),
  );

  const columns = useMemo(() => {
    return ACTIVE_DELIVERY_STAGES.map((stage) => ({
      stage,
      label: DELIVERY_STAGE_LABELS[stage],
      items: items.filter((item) => getItemLifecycle(item)?.stage === stage),
    }));
  }, [items]);

  const itemByKey = useMemo(() => {
    const map = new Map<string, DeliveryBoardItem>();
    for (const item of items) {
      map.set(getItemKey(item), item);
    }
    return map;
  }, [items]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const key = parseDeliveryKanbanCardItemKey(String(event.active.id));
      if (!key) return;
      const item = itemByKey.get(key);
      if (item) setActiveItem(item);
    },
    [itemByKey],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      const { active, over } = event;
      if (!over) return;
      const itemKey = parseDeliveryKanbanCardItemKey(String(active.id));
      if (!itemKey) return;
      const targetStage = resolveDropTargetStage(String(over.id), itemByKey);
      if (!targetStage) return;
      const item = itemByKey.get(itemKey);
      if (!item) return;
      const current = getItemLifecycle(item)?.stage;
      if (!current) return;
      const curIdx = ACTIVE_DELIVERY_STAGES.indexOf(current);
      const targetIdx = ACTIVE_DELIVERY_STAGES.indexOf(targetStage);
      if (targetIdx <= curIdx) return;
      if (getItemLifecycle(item)?.workStatus === 'ON_HOLD') return;
      onMoveToStage(item, targetStage);
    },
    [itemByKey, onMoveToStage],
  );

  const handleDragCancel = useCallback(() => {
    setActiveItem(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-0 flex-1 overflow-x-auto pb-2">
        <div className="flex h-full gap-3">
          {columns.map((col) => (
            <KanbanStageColumn
              key={col.stage}
              stage={col.stage}
              title={col.label}
              count={col.items.length}
            >
              {col.items.map((item) => (
                <KanbanDraggableCard
                  key={getItemKey(item)}
                  id={deliveryKanbanCardId(getItemKey(item))}
                  disabled={
                    busyItemId === getItemId(item) ||
                    getItemLifecycle(item)?.workStatus === 'ON_HOLD'
                  }
                >
                  <ProjectDeliveryBoardCard
                    item={item}
                    isActionBusy={busyItemId === getItemId(item)}
                    onOpenProduct={onOpenProduct}
                    onOpenProductTab={onOpenProductTab}
                    onOpenDetails={onOpenDetails ? () => onOpenDetails(item) : undefined}
                    onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
                    onResume={() => onBoardAction(item, 'RESUME')}
                    onComplete={() => onBoardAction(item, 'COMPLETE')}
                    onCancel={() => onCancel(item)}
                  />
                </KanbanDraggableCard>
              ))}
            </KanbanStageColumn>
          ))}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="shadow-lg">
            <ProjectDeliveryBoardCard
              item={activeItem}
              isActionBusy={false}
              onOpenProduct={onOpenProduct}
              onOpenProductTab={onOpenProductTab}
              onOpenDetails={undefined}
              onMoveNext={() => {}}
              onResume={() => {}}
              onComplete={() => {}}
              onCancel={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanStageColumn({
  stage,
  title,
  count,
  children,
}: {
  stage: DeliveryActiveStage;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: deliveryKanbanColId(stage) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-muted/30 border-border flex h-full min-h-[28rem] shrink-0 flex-col rounded-xl border p-3 transition-colors',
        KANBAN_COLUMN_WIDTH_CLASS,
        isOver && 'ring-primary/25 bg-muted/45 ring-2 ring-inset',
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-muted-foreground text-xs">{count}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {count === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-xs">No cards</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function KanbanDraggableCard({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div ref={setNodeRef} className={cn(isDragging && 'opacity-40')}>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground mt-1 h-8 w-8 shrink-0 touch-none"
          disabled={disabled}
          aria-label="Drag to change stage"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function resolveDropTargetStage(
  overId: string,
  itemByKey: Map<string, DeliveryBoardItem>,
): DeliveryActiveStage | null {
  const columnStage = parseDeliveryKanbanColId(overId);
  if (columnStage) return columnStage;
  const overKey = parseDeliveryKanbanCardItemKey(overId);
  if (!overKey) return null;
  const overItem = itemByKey.get(overKey);
  if (!overItem) return null;
  const stage = getItemLifecycle(overItem)?.stage;
  return stage ?? null;
}
