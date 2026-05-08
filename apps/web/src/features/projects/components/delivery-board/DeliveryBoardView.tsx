'use client';

import { useState } from 'react';
import { isStageGateApiError } from '@/lib/api-errors';
import {
  DeliveryLifecycleActionDialog,
  type DeliveryLifecycleActionPayload,
} from '../DeliveryLifecycleActionDialog';
import { DeliveryBoardStageGateBanner } from './DeliveryBoardStageGateBanner';
import { DeliveryBoardActiveColumns } from './DeliveryBoardActiveColumns';
import { DeliveryBoardClosedBoard } from './DeliveryBoardClosedBoard';
import { runBoardAction, type BoardAction } from './project-delivery-board-actions';
import {
  toBoardStageGateBlocker,
  toDeliveryBoardActionError,
  type DeliveryBoardStageGateBlocker,
} from './project-delivery-board-stage-gate';
import type { ProductBoardTab } from './ProjectDeliveryBoardContextLinks';
import { ProjectDeliveryBoardHeader } from './ProjectDeliveryBoardHeader';
import {
  filterBoardItems,
  getClosedBoardItems,
  getActiveBoardItems,
  getItemId,
  getItemLabel,
  getProjectId,
  type DeliveryBoardItem,
  type DeliveryBoardKindFilter,
  type DeliveryBoardStatusFilter,
} from './project-delivery-board-model';

export interface DeliveryBoardSummaryCounts {
  active: number;
  closed: number;
}

export interface DeliveryBoardViewProps {
  items: DeliveryBoardItem[];
  onRefresh: () => void | Promise<void>;
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
  onRefresh,
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
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [cancelItem, setCancelItem] = useState<DeliveryBoardItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stageGateBlocker, setStageGateBlocker] = useState<DeliveryBoardStageGateBlocker | null>(
    null,
  );
  const effectiveStatus = lockedStatusFilter ?? statusFilter;
  const boardItems = filterBoardItems(items, kindFilter, effectiveStatus);
  const activeItems = getActiveBoardItems(boardItems);
  const closedItems = getClosedBoardItems(boardItems);
  const headerActive = summaryCounts?.active ?? activeItems.length;
  const headerClosed = summaryCounts?.closed ?? closedItems.length;

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
        const pid = getProjectId(item);
        if (pid) setStageGateBlocker(toBoardStageGateBlocker(item, pid, error));
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
        const pid = getProjectId(item);
        if (pid) setStageGateBlocker(toBoardStageGateBlocker(item, pid, error));
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
        activeCount={headerActive}
        closedCount={headerClosed}
        kindFilter={kindFilter}
        statusFilter={effectiveStatus}
        onKindFilterChange={setKindFilter}
        onStatusFilterChange={setStatusFilter}
        hideStatusFilters={Boolean(lockedStatusFilter)}
      />
      {stageGateBlocker && (
        <DeliveryBoardStageGateBanner
          blocker={stageGateBlocker}
          onDismiss={() => setStageGateBlocker(null)}
        />
      )}
      <DeliveryBoardActiveColumns
        items={activeItems}
        busyItemId={busyItemId}
        onOpenProduct={onOpenProduct}
        onOpenProductTab={onOpenProductTab}
        onBoardAction={handleBoardAction}
        onCancel={setCancelItem}
        onOpenDetails={onOpenDetails}
      />
      {includeClosedBoardSection ? (
        <DeliveryBoardClosedBoard
          items={closedItems}
          busyItemId={busyItemId}
          onOpenProduct={onOpenProduct}
          onOpenProductTab={onOpenProductTab}
          onBoardAction={handleBoardAction}
          onCancel={setCancelItem}
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
          setCancelItem(null);
          setActionError(null);
          setStageGateBlocker(null);
        }}
        onConfirm={handleCancelConfirm}
      />
    </section>
  );
}
