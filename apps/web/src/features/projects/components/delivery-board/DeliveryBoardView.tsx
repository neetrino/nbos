'use client';

import { useState } from 'react';
import { DeliveryLifecycleActionDialog } from '../DeliveryLifecycleActionDialog';
import { DeliveryBoardStageGateBanner } from './DeliveryBoardStageGateBanner';
import { DeliveryBoardActiveColumns } from './DeliveryBoardActiveColumns';
import { DeliveryBoardClosedBoard } from './DeliveryBoardClosedBoard';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';
import { ProjectDeliveryBoardHeader } from './ProjectDeliveryBoardHeader';
import {
  filterBoardItems,
  getClosedBoardItems,
  getActiveBoardItems,
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
  /** When false, omit embedded Closed section (separate Closed tab on global board). */
  includeClosedBoardSection?: boolean;
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
  includeClosedBoardSection = true,
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
    stageGateBlocker,
    handleBoardAction,
    requestCancel,
    handleCancelConfirm,
    dismissStageGate,
    clearActionDialog,
  } = mutations;
  const effectiveStatus = lockedStatusFilter ?? statusFilter;
  const boardItems = filterBoardItems(items, kindFilter, effectiveStatus);
  const activeItems = getActiveBoardItems(boardItems);
  const closedItems = getClosedBoardItems(boardItems);
  const headerActive = summaryCounts?.active ?? activeItems.length;
  const headerClosed = summaryCounts?.closed ?? closedItems.length;

  return (
    <section className="space-y-4">
      <ProjectDeliveryBoardHeader
        activeCount={headerActive}
        closedCount={headerClosed}
        kindFilter={kindFilter}
        statusFilter={effectiveStatus}
        onKindFilterChange={setKindFilter}
        onStatusFilterChange={setStatusFilter}
        hideStatusFilters={Boolean(lockedStatusFilter)}
      />
      {stageGateBlocker && (
        <DeliveryBoardStageGateBanner blocker={stageGateBlocker} onDismiss={dismissStageGate} />
      )}
      <DeliveryBoardActiveColumns
        items={activeItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onOpenProductTab={onOpenProductTab}
        onBoardAction={handleBoardAction}
        onCancel={requestCancel}
        onOpenDetails={onOpenDetails}
      />
      {includeClosedBoardSection ? (
        <DeliveryBoardClosedBoard
          items={closedItems}
          busyItemId={busyItemId}
          onOpenProduct={onOpenProduct}
          onOpenProductTab={onOpenProductTab}
          onBoardAction={handleBoardAction}
          onCancel={requestCancel}
          onOpenDetails={onOpenDetails}
        />
      ) : null}
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
