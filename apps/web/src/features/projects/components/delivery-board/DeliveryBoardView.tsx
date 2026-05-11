'use client';

import { useState } from 'react';
import { DeliveryLifecycleActionDialog } from '../DeliveryLifecycleActionDialog';
import { DeliveryBoardClosedBoard } from './DeliveryBoardClosedBoard';
import { DeliveryBoardStageGateDialog } from './DeliveryBoardStageGateDialog';
import { DeliveryKanbanBoard } from './DeliveryKanbanBoard';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';
import { ProjectDeliveryBoardHeader } from './ProjectDeliveryBoardHeader';
import {
  countDeliveryAggregates,
  filterBoardItems,
  getActiveBoardItems,
  getClosedBoardItems,
  getItemId,
  getItemLabel,
  type DeliveryBoardItem,
  type DeliveryBoardKindFilter,
  type DeliveryBoardStatusFilter,
} from './project-delivery-board-model';
import type { UseDeliveryBoardMutationsResult } from './use-delivery-board-mutations';

export interface DeliveryBoardSummaryCounts {
  active: number;
  closed: number;
}

export interface DeliveryBoardViewProps {
  items: DeliveryBoardItem[];
  mutations: UseDeliveryBoardMutationsResult;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  onOpenDetails?: (item: DeliveryBoardItem) => void;
  /** Locks pipeline filter (e.g. ACTIVE on global Active tab). */
  lockedStatusFilter?: DeliveryBoardStatusFilter;
  /** Header badges when scope hides part of the board (e.g. global Active tab). */
  summaryCounts?: DeliveryBoardSummaryCounts;
}

export function DeliveryBoardView({
  items,
  mutations,
  onOpenProduct,
  onOpenProductTab,
  onOpenDetails,
  lockedStatusFilter,
  summaryCounts,
}: DeliveryBoardViewProps) {
  const [kindFilter, setKindFilter] = useState<DeliveryBoardKindFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<DeliveryBoardStatusFilter>(
    lockedStatusFilter ?? 'ACTIVE',
  );
  const {
    busyItemId,
    cancelItem,
    actionError,
    stageGateResolution,
    handleBoardAction,
    advanceToDeliveryStage,
    requestCancel,
    handleCancelConfirm,
    dismissStageGate,
    retryStageGateMove,
    clearActionDialog,
  } = mutations;
  const effectiveStatus = lockedStatusFilter ?? statusFilter;
  const boardItems = filterBoardItems(items, kindFilter, effectiveStatus);
  const activeItems = getActiveBoardItems(boardItems);
  const closedItems = getClosedBoardItems(boardItems);
  const aggregateCounts = countDeliveryAggregates(items);
  const headerActive = summaryCounts?.active ?? aggregateCounts.active;
  const headerClosed = summaryCounts?.closed ?? aggregateCounts.closed;
  const isClosedMode = effectiveStatus === 'CLOSED';

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0">
        <ProjectDeliveryBoardHeader
          activeCount={headerActive}
          closedCount={headerClosed}
          kindFilter={kindFilter}
          statusFilter={effectiveStatus}
          onKindFilterChange={setKindFilter}
          onStatusFilterChange={setStatusFilter}
          hideStatusFilters={Boolean(lockedStatusFilter)}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {isClosedMode ? (
          <DeliveryBoardClosedBoard
            items={closedItems}
            busyItemId={busyItemId}
            onOpenProduct={onOpenProduct}
            onOpenProductTab={onOpenProductTab}
            onBoardAction={handleBoardAction}
            onCancel={requestCancel}
            onOpenDetails={onOpenDetails}
          />
        ) : (
          <DeliveryKanbanBoard
            items={activeItems}
            busyItemId={busyItemId}
            onOpenProduct={onOpenProduct}
            onOpenProductTab={onOpenProductTab}
            onBoardAction={handleBoardAction}
            onCancel={requestCancel}
            onOpenDetails={onOpenDetails}
            onMoveToStage={(item, target) => void advanceToDeliveryStage(item, target)}
          />
        )}
      </div>
      <DeliveryBoardStageGateDialog
        resolution={stageGateResolution}
        onOpenChange={(open) => {
          if (!open) dismissStageGate();
        }}
        onRetry={retryStageGateMove}
        onOpenDetails={(item) => {
          onOpenDetails?.(item);
          dismissStageGate();
        }}
      />
      <DeliveryLifecycleActionDialog
        action={cancelItem ? 'cancel' : null}
        entityLabel={cancelItem ? getItemLabel(cancelItem) : 'delivery item'}
        isSubmitting={cancelItem ? busyItemId === getItemId(cancelItem) : false}
        error={actionError}
        onOpenChange={(open) => {
          if (open) return;
          clearActionDialog();
        }}
        onConfirm={handleCancelConfirm}
      />
    </section>
  );
}
