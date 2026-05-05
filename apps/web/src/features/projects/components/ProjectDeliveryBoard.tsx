'use client';

import { useState } from 'react';
import type { DeliveryLifecycleProjection, FullProject } from '@/lib/api/projects';
import { isStageGateApiError } from '@/lib/api-errors';
import {
  DeliveryLifecycleActionDialog,
  type DeliveryLifecycleActionPayload,
} from './DeliveryLifecycleActionDialog';
import { DeliveryBoardStageGateBanner } from './delivery-board/DeliveryBoardStageGateBanner';
import { ProjectDeliveryBoardCard } from './delivery-board/ProjectDeliveryBoardCard';
import { runBoardAction, type BoardAction } from './delivery-board/project-delivery-board-actions';
import {
  toBoardStageGateBlocker,
  toDeliveryBoardActionError,
  type DeliveryBoardStageGateBlocker,
} from './delivery-board/project-delivery-board-stage-gate';
import type { ProductBoardTab } from './delivery-board/ProjectDeliveryBoardContextLinks';
import { ProjectDeliveryBoardHeader } from './delivery-board/ProjectDeliveryBoardHeader';
import {
  ACTIVE_DELIVERY_STAGES,
  DELIVERY_STAGE_LABELS,
  filterBoardItems,
  getActiveBoardItems,
  getBoardItems,
  getClosedBoardItems,
  getItemId,
  getItemKey,
  getItemLabel,
  getItemLifecycle,
  type DeliveryBoardItem,
  type DeliveryBoardKindFilter,
  type DeliveryBoardStatusFilter,
} from './delivery-board/project-delivery-board-model';

interface ProjectDeliveryBoardProps {
  project: FullProject;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onRefresh: () => void | Promise<void>;
}

export function ProjectDeliveryBoard({
  project,
  onOpenProduct,
  onOpenProductTab,
  onRefresh,
}: ProjectDeliveryBoardProps) {
  const [kindFilter, setKindFilter] = useState<DeliveryBoardKindFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<DeliveryBoardStatusFilter>('ACTIVE');
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [cancelItem, setCancelItem] = useState<DeliveryBoardItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stageGateBlocker, setStageGateBlocker] = useState<DeliveryBoardStageGateBlocker | null>(
    null,
  );
  const boardItems = filterBoardItems(getBoardItems(project), kindFilter, statusFilter);
  const activeItems = getActiveBoardItems(boardItems);
  const closedItems = getClosedBoardItems(boardItems);

  const handleBoardAction = async (item: DeliveryBoardItem, action: BoardAction) => {
    const itemId = getItemId(item);
    setBusyItemId(itemId);
    setActionError(null);
    setStageGateBlocker(null);
    try {
      await runBoardAction(item, action);
      await onRefresh();
    } catch (error) {
      if (isStageGateApiError(error)) {
        setStageGateBlocker(toBoardStageGateBlocker(item, project.id, error));
      } else {
        setActionError(toDeliveryBoardActionError(error, 'Delivery board action failed.'));
      }
    } finally {
      setBusyItemId(null);
    }
  };

  const handleCancelConfirm = async (payload: DeliveryLifecycleActionPayload) => {
    if (!cancelItem) return;
    const item = cancelItem;
    setBusyItemId(getItemId(item));
    setActionError(null);
    setStageGateBlocker(null);
    try {
      await runBoardAction(item, 'CANCEL', payload);
      setCancelItem(null);
      await onRefresh();
    } catch (error) {
      if (isStageGateApiError(error)) {
        setStageGateBlocker(toBoardStageGateBlocker(item, project.id, error));
      } else {
        setActionError(toDeliveryBoardActionError(error, 'Delivery item could not be cancelled.'));
      }
    } finally {
      setBusyItemId(null);
    }
  };

  return (
    <section className="space-y-4">
      <ProjectDeliveryBoardHeader
        activeCount={activeItems.length}
        closedCount={closedItems.length}
        kindFilter={kindFilter}
        statusFilter={statusFilter}
        onKindFilterChange={setKindFilter}
        onStatusFilterChange={setStatusFilter}
      />
      {stageGateBlocker && (
        <DeliveryBoardStageGateBanner
          blocker={stageGateBlocker}
          onDismiss={() => setStageGateBlocker(null)}
        />
      )}
      <div className="grid gap-3 xl:grid-cols-4">
        {ACTIVE_DELIVERY_STAGES.map((stage) => (
          <DeliveryStageColumn
            key={stage}
            stage={stage}
            items={activeItems.filter((item) => getItemLifecycle(item)?.stage === stage)}
            busyItemId={busyItemId}
            onOpenProduct={onOpenProduct}
            onOpenProductTab={onOpenProductTab}
            onBoardAction={handleBoardAction}
            onCancel={setCancelItem}
          />
        ))}
      </div>
      <ClosedDeliveryView
        items={closedItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onOpenProductTab={onOpenProductTab}
        onBoardAction={handleBoardAction}
        onCancel={setCancelItem}
      />
      <DeliveryLifecycleActionDialog
        action={cancelItem ? 'cancel' : null}
        entityLabel={cancelItem ? getItemLabel(cancelItem) : 'delivery item'}
        isSubmitting={cancelItem ? busyItemId === getItemId(cancelItem) : false}
        error={actionError}
        onOpenChange={(open) => {
          if (open) return;
          setCancelItem(null);
          setActionError(null);
          setStageGateBlocker(null);
        }}
        onConfirm={handleCancelConfirm}
      />
    </section>
  );
}

function DeliveryStageColumn({
  stage,
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
}: {
  stage: Exclude<DeliveryLifecycleProjection['stage'], null>;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
}) {
  return (
    <div className="bg-muted/30 border-border min-h-40 rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{DELIVERY_STAGE_LABELS[stage]}</h3>
        <span className="text-muted-foreground text-xs">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-xs">No cards</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ProjectDeliveryBoardCard
              key={getItemKey(item)}
              item={item}
              isActionBusy={busyItemId === getItemId(item)}
              onOpenProduct={onOpenProduct}
              onOpenProductTab={onOpenProductTab}
              onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
              onResume={() => onBoardAction(item, 'RESUME')}
              onComplete={() => onBoardAction(item, 'COMPLETE')}
              onCancel={() => onCancel(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClosedDeliveryView({
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
}: {
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
}) {
  if (items.length === 0) return null;
  const doneItems = items.filter((item) => getItemLifecycle(item)?.resolution === 'DONE');
  const cancelledItems = items.filter((item) => getItemLifecycle(item)?.resolution === 'CANCELLED');

  return (
    <div className="bg-muted/20 border-border rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Closed</h3>
        <span className="text-muted-foreground text-xs">
          {doneItems.length} done · {cancelledItems.length} cancelled
        </span>
      </div>
      <ClosedGroup
        title="Done"
        items={doneItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onOpenProductTab={onOpenProductTab}
        onBoardAction={onBoardAction}
        onCancel={onCancel}
      />
      <ClosedGroup
        title="Cancelled"
        items={cancelledItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onOpenProductTab={onOpenProductTab}
        onBoardAction={onBoardAction}
        onCancel={onCancel}
      />
    </div>
  );
}

function ClosedGroup({
  title,
  items,
  busyItemId,
  onOpenProduct,
  onOpenProductTab,
  onBoardAction,
  onCancel,
}: {
  title: string;
  items: DeliveryBoardItem[];
  busyItemId: string | null;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onBoardAction: (item: DeliveryBoardItem, action: BoardAction) => void;
  onCancel: (item: DeliveryBoardItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium">{title}</p>
      <div className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <ProjectDeliveryBoardCard
            key={getItemKey(item)}
            item={item}
            isActionBusy={busyItemId === getItemId(item)}
            onOpenProduct={onOpenProduct}
            onOpenProductTab={onOpenProductTab}
            onMoveNext={() => onBoardAction(item, 'MOVE_NEXT')}
            onResume={() => onBoardAction(item, 'RESUME')}
            onComplete={() => onBoardAction(item, 'COMPLETE')}
            onCancel={() => onCancel(item)}
          />
        ))}
      </div>
    </div>
  );
}
