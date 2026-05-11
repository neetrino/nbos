'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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
  /** When false, the board toolbar is omitted (parent renders Project Hub–style header). */
  showBoardHeader?: boolean;
  /** Controlled kind filter; use with `onKindFilterChange` when `showBoardHeader` is false. */
  kindFilter?: DeliveryBoardKindFilter;
  onKindFilterChange?: (filter: DeliveryBoardKindFilter) => void;
}

export function DeliveryBoardView({
  items,
  mutations,
  onOpenProduct,
  onOpenProductTab,
  onOpenDetails,
  lockedStatusFilter,
  summaryCounts,
  showBoardHeader = true,
  kindFilter: kindFilterProp,
  onKindFilterChange: onKindFilterChangeProp,
}: DeliveryBoardViewProps) {
  const [internalKind, setInternalKind] = useState<DeliveryBoardKindFilter>('ALL');
  const isKindControlled = kindFilterProp !== undefined && onKindFilterChangeProp !== undefined;
  const kindFilter = isKindControlled ? kindFilterProp : internalKind;
  const setKindFilter = isKindControlled ? onKindFilterChangeProp : setInternalKind;
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
  const renderBoardHeader = showBoardHeader;

  return (
    <section
      className={
        renderBoardHeader
          ? 'flex min-h-0 flex-1 flex-col gap-4'
          : 'flex min-h-0 min-w-0 flex-1 basis-0 flex-col'
      }
    >
      {renderBoardHeader ? (
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
      ) : null}
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 basis-0 flex-col',
          !isClosedMode && 'overflow-hidden',
        )}
      >
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
