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
import { Fragment, useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  KanbanColumnInsertPlaceholder,
  KanbanInsertPlaceholderAfterList,
  KanbanInsertPlaceholderBeforeItem,
} from '@/components/shared/kanban/KanbanColumnInsertPlaceholder';
import {
  KANBAN_CARD_ROW_DATA_ATTR,
  KANBAN_COLUMN_LIST_DATA_ATTR,
} from '@/components/shared/kanban/kanban-insert-index';
import { KANBAN_COLUMN_LEFT_RULE_CLASS } from '@/components/shared/kanban/kanban-column-surface';
import { useKanbanPointerInsert } from '@/components/shared/kanban/use-kanban-pointer-insert';
import { cn } from '@/lib/utils';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import {
  DELIVERY_BOARD_TASK_LINK_PROJECT_ENTITY,
  DELIVERY_STAGE_HEX_COLORS,
} from './delivery-kanban-board.constants';
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

/** Matches Deal-style “click vs drag”: small movement starts a stage move; pure click still works. */
const POINTER_ACTIVATION_PX = 6;

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
  const [dragCardHeightPx, setDragCardHeightPx] = useState<number | null>(null);
  const [quickCreateProjectId, setQuickCreateProjectId] = useState<string | null>(null);
  const { creatorId, creatorReady } = useTaskCreatorId();
  const quickTaskDisabled = creatorReady && !creatorId;
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

  const dragSourceStage = activeItem ? (getItemLifecycle(activeItem)?.stage ?? null) : null;
  const dropInsert = useKanbanPointerInsert({
    active: activeItem !== null,
    sourceColumnKey: dragSourceStage,
    columnKeys: ACTIVE_DELIVERY_STAGES,
    excludeItemId: activeItem ? getItemKey(activeItem) : undefined,
  });

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
      const height = event.active.rect.current.initial?.height;
      setDragCardHeightPx(height && height > 0 ? Math.round(height) : null);
    },
    [itemByKey],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveItem(null);
      setDragCardHeightPx(null);
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
    setDragCardHeightPx(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Same height contract as shared KanbanBoard (Deal Pipeline): flex-1 + min-h-0 + column overflow-y-auto. */}
      <div className="flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden">
        <div
          className={cn(
            'flex h-full min-h-0 w-full flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap',
            'sm:items-stretch',
          )}
        >
          {columns.map((col, colIdx) => (
            <div
              key={col.stage}
              className={cn(
                'mx-2 flex min-h-0 min-w-[288px] flex-1 flex-col sm:max-w-[calc(50%-0.375rem)] sm:min-w-[calc(50%-0.375rem)] sm:flex-none sm:basis-[calc(50%-0.375rem)]',
                'lg:max-w-none lg:min-w-[288px] lg:flex-1 lg:basis-0',
              )}
            >
              <KanbanStageColumn
                stage={col.stage}
                title={col.label}
                count={col.items.length}
                showLeftRule={colIdx > 0}
                dragCardHeightPx={dragCardHeightPx}
                dropInsertIndex={dropInsert?.columnKey === col.stage ? dropInsert.index : null}
                isDropTarget={dropInsert?.columnKey === col.stage && dragSourceStage !== col.stage}
              >
                {col.items.map((item, itemIdx) => (
                  <Fragment key={getItemKey(item)}>
                    <KanbanInsertPlaceholderBeforeItem
                      insertIndex={dropInsert?.columnKey === col.stage ? dropInsert.index : null}
                      itemIdx={itemIdx}
                      isDropTarget={
                        dropInsert?.columnKey === col.stage && dragSourceStage !== col.stage
                      }
                      heightPx={dragCardHeightPx}
                    />
                    <KanbanDraggableCard
                      id={deliveryKanbanCardId(getItemKey(item))}
                      itemKey={getItemKey(item)}
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
                        kanbanActionIsolation
                        kanbanMinimal
                        onOpenQuickTaskForProject={(pid) => setQuickCreateProjectId(pid)}
                        quickTaskDisabled={quickTaskDisabled}
                      />
                    </KanbanDraggableCard>
                  </Fragment>
                ))}
              </KanbanStageColumn>
            </div>
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
              kanbanMinimal
              suppressKanbanHoverInteractions
            />
          </div>
        ) : null}
      </DragOverlay>
      <QuickCreateTaskDialog
        open={quickCreateProjectId !== null}
        onOpenChange={(open) => {
          if (!open) setQuickCreateProjectId(null);
        }}
        creatorId={creatorId ?? ''}
        creatorReady={creatorReady}
        defaultLink={
          quickCreateProjectId
            ? {
                entityType: DELIVERY_BOARD_TASK_LINK_PROJECT_ENTITY,
                entityId: quickCreateProjectId,
              }
            : undefined
        }
      />
    </DndContext>
  );
}

function KanbanStageColumn({
  stage,
  title,
  count,
  showLeftRule,
  dragCardHeightPx,
  dropInsertIndex,
  isDropTarget,
  children,
}: {
  stage: DeliveryActiveStage;
  title: string;
  count: number;
  showLeftRule: boolean;
  dragCardHeightPx: number | null;
  dropInsertIndex: number | null;
  isDropTarget: boolean;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: deliveryKanbanColId(stage) });
  const hex = DELIVERY_STAGE_HEX_COLORS[stage];

  const raw = hex.replace('#', '');
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  const textColor = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';
  const countBg = textColor === '#fff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)';

  return (
    <div ref={setNodeRef} className={cn('relative flex h-full min-h-0 min-w-0 flex-1 flex-col')}>
      {showLeftRule ? <div className={KANBAN_COLUMN_LEFT_RULE_CLASS} aria-hidden /> : null}
      {/* Colored header pill — same pattern as KanbanColumnHeader */}
      <div
        className="mb-3 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5"
        style={{ backgroundColor: hex }}
      >
        <span className="min-w-0 truncate text-sm font-bold" style={{ color: textColor }}>
          {title}
        </span>
        <span
          className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums"
          style={{ backgroundColor: countBg, color: textColor }}
        >
          {count}
        </span>
      </div>

      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pr-1">
        <div className="space-y-3 pb-3" {...{ [KANBAN_COLUMN_LIST_DATA_ATTR]: stage }}>
          <KanbanColumnInsertPlaceholder
            insertIndex={dropInsertIndex}
            itemCount={count}
            isDropTarget={isDropTarget}
            heightPx={dragCardHeightPx}
          />
          {count > 0 ? children : null}
          <KanbanInsertPlaceholderAfterList
            insertIndex={dropInsertIndex}
            itemCount={count}
            isDropTarget={isDropTarget}
            heightPx={dragCardHeightPx}
          />
          {count === 0 && !isDropTarget ? (
            <p className="text-muted-foreground py-8 text-center text-xs">No cards</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function KanbanDraggableCard({
  id,
  itemKey,
  disabled,
  children,
}: {
  id: string;
  itemKey: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      {...{ [KANBAN_CARD_ROW_DATA_ATTR]: true }}
      data-item-id={itemKey}
      className={cn(
        'touch-manipulation rounded-xl transition-transform duration-200 outline-none',
        disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'scale-[0.98] opacity-45',
      )}
    >
      <div className="min-w-0">{children}</div>
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
