'use client';

import { Fragment, useCallback, useMemo, useState, type DragEvent, type ReactNode } from 'react';
import {
  KanbanColumnInsertPlaceholder,
  KanbanInsertPlaceholderAfterList,
  KanbanInsertPlaceholderBeforeItem,
} from '@/components/shared/kanban/KanbanColumnInsertPlaceholder';
import {
  findKanbanColumnList,
  KANBAN_CARD_ROW_DATA_ATTR,
  KANBAN_COLUMN_DROP_ZONE_DATA_ATTR,
  KANBAN_COLUMN_LIST_DATA_ATTR,
  resolveKanbanInsertIndex,
  type KanbanPointerInsert,
} from '@/components/shared/kanban/kanban-insert-index';
import { KANBAN_COLUMN_LEFT_RULE_CLASS } from '@/components/shared/kanban/kanban-column-surface';
import { measureKanbanCardRowHeight } from '@/components/shared/kanban/kanban-drag-metrics';
import { KanbanScrollEdgeControls } from '@/components/shared/kanban/KanbanScrollEdgeControls';
import { KanbanTerminalDropBar } from '@/components/shared/kanban/KanbanTerminalDropBar';
import { useKanbanHorizontalScroll } from '@/components/shared/kanban/use-kanban-horizontal-scroll';
import { cn } from '@/lib/utils';
import { QuickCreateTaskDialog } from '@/features/tasks/components/QuickCreateTaskDialog';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { ProjectDeliveryBoardCard } from './ProjectDeliveryBoardCard';
import {
  DELIVERY_BOARD_TASK_LINK_PROJECT_ENTITY,
  DELIVERY_STAGE_HEX_COLORS,
} from './delivery-kanban-board.constants';
import { DELIVERY_TERMINAL_DROP_ZONES } from './delivery-terminal-drop-zones';
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
import {
  DELIVERY_KANBAN_BOARD_ROW_CLASS,
  DELIVERY_KANBAN_BOARD_SCROLL_CLASS,
  DELIVERY_KANBAN_COLUMN_GAP_PX,
  DELIVERY_KANBAN_COLUMN_SHELL_CLASS,
  DELIVERY_KANBAN_COLUMN_WIDTH_PX,
  deliveryKanbanBoardMinWidthPx,
} from './delivery-kanban-layout';

interface DeliveryDragItem {
  id: string;
  fromColumn: DeliveryActiveStage;
}

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
  const [dragItem, setDragItem] = useState<DeliveryDragItem | null>(null);
  const [dragCardHeightPx, setDragCardHeightPx] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<DeliveryActiveStage | null>(null);
  const [dropInsert, setDropInsert] = useState<KanbanPointerInsert | null>(null);
  const [terminalDropTarget, setTerminalDropTarget] = useState<string | null>(null);
  const [quickCreateProjectId, setQuickCreateProjectId] = useState<string | null>(null);
  const [optimisticStageByKey, setOptimisticStageByKey] = useState<
    Partial<Record<string, DeliveryActiveStage>>
  >({});
  const { creatorId, creatorReady } = useTaskCreatorId();
  const quickTaskDisabled = creatorReady && !creatorId;

  const displayItems = useMemo(() => {
    if (Object.keys(optimisticStageByKey).length === 0) return items;
    return items.map((item) => {
      const key = getItemKey(item);
      const optimisticStage = optimisticStageByKey[key];
      if (!optimisticStage) return item;
      const serverStage = getItemLifecycle(item)?.stage;
      if (serverStage === optimisticStage) return item;
      return withOptimisticDeliveryStage(item, optimisticStage);
    });
  }, [items, optimisticStageByKey]);

  const columns = useMemo(() => {
    return ACTIVE_DELIVERY_STAGES.map((stage) => ({
      stage,
      label: DELIVERY_STAGE_LABELS[stage],
      items: displayItems.filter((item) => getItemLifecycle(item)?.stage === stage),
    }));
  }, [displayItems]);

  const {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    isMobileViewport,
    startAutoScroll,
    stopAutoScroll,
    scrollByOneColumn,
  } = useKanbanHorizontalScroll({
    columnWidth: DELIVERY_KANBAN_COLUMN_WIDTH_PX,
    columnMarginTotalPx: DELIVERY_KANBAN_COLUMN_GAP_PX,
    layoutKey: columns.length,
    mobileFullWidthColumns: false,
  });

  const itemByKey = useMemo(() => {
    const map = new Map<string, DeliveryBoardItem>();
    for (const item of items) {
      map.set(getItemKey(item), item);
    }
    return map;
  }, [items]);

  const clearDragState = useCallback(() => {
    setDragItem(null);
    setDragCardHeightPx(null);
    setDropTarget(null);
    setDropInsert(null);
    setTerminalDropTarget(null);
  }, []);

  const handleDragStart = useCallback(
    (itemKey: string, fromColumn: DeliveryActiveStage, event: DragEvent<HTMLDivElement>) => {
      const item = itemByKey.get(itemKey);
      if (!item || getItemLifecycle(item)?.workStatus === 'ON_HOLD') {
        event.preventDefault();
        return;
      }

      setDragCardHeightPx(measureKanbanCardRowHeight(event.currentTarget));
      setDragItem({ id: itemKey, fromColumn });
      setTerminalDropTarget(null);
      setDropTarget(null);
      setDropInsert(null);
    },
    [itemByKey],
  );

  const handleColumnDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, stage: DeliveryActiveStage) => {
      event.preventDefault();
      if (!dragItem) {
        setDropTarget(null);
        setDropInsert(null);
        return;
      }

      const list = findKanbanColumnList(event.currentTarget);
      if (!list) return;

      setDropTarget(stage);
      const excludeId = dragItem.fromColumn === stage ? dragItem.id : undefined;
      const index = resolveKanbanInsertIndex(list, event.clientY, excludeId);
      setDropInsert({ columnKey: stage, index });
    },
    [dragItem],
  );

  const handleColumnDrop = useCallback(
    (stage: DeliveryActiveStage) => {
      if (!dragItem) {
        clearDragState();
        return;
      }

      const item = itemByKey.get(dragItem.id);
      if (!item || getItemLifecycle(item)?.workStatus === 'ON_HOLD') {
        clearDragState();
        return;
      }

      const sourceIdx = ACTIVE_DELIVERY_STAGES.indexOf(dragItem.fromColumn);
      const targetIdx = ACTIVE_DELIVERY_STAGES.indexOf(stage);
      if (targetIdx > sourceIdx) {
        setOptimisticStageByKey((current) => ({ ...current, [dragItem.id]: stage }));
        onMoveToStage(item, stage);
      }

      clearDragState();
    },
    [clearDragState, dragItem, itemByKey, onMoveToStage],
  );

  const handleTerminalDrop = useCallback(
    (zoneKey: string) => {
      if (!dragItem) {
        clearDragState();
        return;
      }

      const item = itemByKey.get(dragItem.id);
      if (!item || getItemLifecycle(item)?.workStatus === 'ON_HOLD') {
        clearDragState();
        return;
      }

      if (zoneKey === 'DONE') {
        void onBoardAction(item, 'COMPLETE');
      } else if (zoneKey === 'CANCELLED') {
        onCancel(item);
      }

      clearDragState();
    },
    [clearDragState, dragItem, itemByKey, onBoardAction, onCancel],
  );

  const isForwardDropColumn = useCallback(
    (stage: DeliveryActiveStage) => {
      if (!dragItem || dropTarget !== stage) return false;
      const sourceIdx = ACTIVE_DELIVERY_STAGES.indexOf(dragItem.fromColumn);
      const targetIdx = ACTIVE_DELIVERY_STAGES.indexOf(stage);
      return sourceIdx >= 0 && targetIdx > sourceIdx;
    },
    [dragItem, dropTarget],
  );

  return (
    <div className="relative flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden">
      <KanbanScrollEdgeControls
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        isMobile={isMobileViewport}
        onStep={scrollByOneColumn}
        onHoverStart={startAutoScroll}
        onHoverEnd={stopAutoScroll}
      />
      <div
        ref={scrollRef}
        className={cn(
          DELIVERY_KANBAN_BOARD_SCROLL_CLASS,
          isMobileViewport && 'snap-x snap-mandatory',
          dragItem && 'pb-28',
        )}
      >
        <div
          className={DELIVERY_KANBAN_BOARD_ROW_CLASS}
          style={{ minWidth: `${deliveryKanbanBoardMinWidthPx(columns.length)}px` }}
        >
          {columns.map((col, colIdx) => (
            <div
              key={col.stage}
              className={cn(DELIVERY_KANBAN_COLUMN_SHELL_CLASS, isMobileViewport && 'snap-start')}
            >
              <KanbanStageColumn
                stage={col.stage}
                title={col.label}
                count={col.items.length}
                showLeftRule={colIdx > 0}
                dragCardHeightPx={dragCardHeightPx}
                dropInsertIndex={dropInsert?.columnKey === col.stage ? dropInsert.index : null}
                isDropTarget={isForwardDropColumn(col.stage)}
                onDragOver={(event) => handleColumnDragOver(event, col.stage)}
                onDrop={() => handleColumnDrop(col.stage)}
              >
                {col.items.map((item, itemIdx) => {
                  const itemKey = getItemKey(item);
                  const cardDisabled =
                    busyItemId === getItemId(item) ||
                    getItemLifecycle(item)?.workStatus === 'ON_HOLD';

                  return (
                    <Fragment key={itemKey}>
                      <KanbanInsertPlaceholderBeforeItem
                        insertIndex={dropInsert?.columnKey === col.stage ? dropInsert.index : null}
                        itemIdx={itemIdx}
                        isDropTarget={isForwardDropColumn(col.stage)}
                        heightPx={dragCardHeightPx}
                      />
                      <KanbanDraggableCard
                        itemKey={itemKey}
                        fromStage={col.stage}
                        isDragging={dragItem?.id === itemKey}
                        disabled={cardDisabled}
                        onDragStart={handleDragStart}
                        onDragEnd={clearDragState}
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
                  );
                })}
              </KanbanStageColumn>
            </div>
          ))}
        </div>
      </div>
      {dragItem ? (
        <KanbanTerminalDropBar
          zones={DELIVERY_TERMINAL_DROP_ZONES}
          activeZoneKey={terminalDropTarget}
          onDragOver={setTerminalDropTarget}
          onDragLeave={() => setTerminalDropTarget(null)}
          onDrop={handleTerminalDrop}
        />
      ) : null}
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
    </div>
  );
}

function withOptimisticDeliveryStage(
  item: DeliveryBoardItem,
  stage: DeliveryActiveStage,
): DeliveryBoardItem {
  const lifecycle = getItemLifecycle(item);
  if (!lifecycle || lifecycle.stage === stage) return item;
  const nextLifecycle = { ...lifecycle, stage };
  if (item.kind === 'PRODUCT') {
    return { ...item, product: { ...item.product, deliveryLifecycle: nextLifecycle } };
  }
  return { ...item, extension: { ...item.extension, deliveryLifecycle: nextLifecycle } };
}

function KanbanStageColumn({
  stage,
  title,
  count,
  showLeftRule,
  dragCardHeightPx,
  dropInsertIndex,
  isDropTarget,
  onDragOver,
  onDrop,
  children,
}: {
  stage: DeliveryActiveStage;
  title: string;
  count: number;
  showLeftRule: boolean;
  dragCardHeightPx: number | null;
  dropInsertIndex: number | null;
  isDropTarget: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: () => void;
  children: ReactNode;
}) {
  const hex = DELIVERY_STAGE_HEX_COLORS[stage];

  const raw = hex.replace('#', '');
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  const textColor = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#000' : '#fff';

  return (
    <div className={cn('relative flex h-full min-h-0 min-w-0 flex-1 flex-col')}>
      {showLeftRule ? <div className={KANBAN_COLUMN_LEFT_RULE_CLASS} aria-hidden /> : null}
      <div
        className="mb-3 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5"
        style={{ backgroundColor: hex }}
      >
        <span className="min-w-0 truncate text-sm font-bold" style={{ color: textColor }}>
          {title}
        </span>
        <span
          className="ml-auto shrink-0 text-xs font-medium tabular-nums"
          style={{ color: textColor }}
        >
          {count}
        </span>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        {...{ [KANBAN_COLUMN_DROP_ZONE_DATA_ATTR]: stage }}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div
          className={cn(
            'flex min-w-0 flex-col space-y-3 pb-3',
            isDropTarget ? 'min-h-[3rem]' : 'min-h-full',
          )}
          {...{ [KANBAN_COLUMN_LIST_DATA_ATTR]: stage }}
        >
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
  itemKey,
  fromStage,
  isDragging,
  disabled,
  onDragStart,
  onDragEnd,
  children,
}: {
  itemKey: string;
  fromStage: DeliveryActiveStage;
  isDragging: boolean;
  disabled: boolean;
  onDragStart: (
    itemKey: string,
    fromStage: DeliveryActiveStage,
    event: DragEvent<HTMLDivElement>,
  ) => void;
  onDragEnd: () => void;
  children: ReactNode;
}) {
  return (
    <div
      draggable={!disabled}
      onDragStart={(event) => onDragStart(itemKey, fromStage, event)}
      onDragEnd={onDragEnd}
      {...{ [KANBAN_CARD_ROW_DATA_ATTR]: true }}
      data-item-id={itemKey}
      className={cn(
        'rounded-xl transition-opacity duration-150 outline-none select-none',
        disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        isDragging && 'scale-[0.98] opacity-45',
      )}
    >
      <div className="min-w-0">{children}</div>
    </div>
  );
}
