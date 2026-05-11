'use client';

import { useCallback, useState } from 'react';
import { isStageGateApiError } from '@/lib/api-errors';
import type { DeliveryLifecycleActionPayload } from '@/features/projects/components/DeliveryLifecycleActionDialog';
import {
  advanceDeliveryItemToStage,
  runBoardAction,
  type BoardAction,
  type DeliveryActiveStage,
} from './project-delivery-board-actions';
import {
  toBoardStageGateBlocker,
  toDeliveryBoardActionError,
  type DeliveryBoardStageGateBlocker,
} from './project-delivery-board-stage-gate';
import { getItemId, getProjectId, type DeliveryBoardItem } from './project-delivery-board-model';

export interface UseDeliveryBoardMutationsResult {
  busyItemId: string | null;
  cancelItem: DeliveryBoardItem | null;
  actionError: string | null;
  stageGateBlocker: DeliveryBoardStageGateBlocker | null;
  handleBoardAction: (item: DeliveryBoardItem, action: BoardAction) => Promise<void>;
  advanceToDeliveryStage: (item: DeliveryBoardItem, target: DeliveryActiveStage) => Promise<void>;
  requestCancel: (item: DeliveryBoardItem) => void;
  handleCancelConfirm: (payload: DeliveryLifecycleActionPayload) => Promise<void>;
  dismissStageGate: () => void;
  clearActionDialog: () => void;
}

export function useDeliveryBoardMutations(
  onRefresh: () => void | Promise<void>,
): UseDeliveryBoardMutationsResult {
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [cancelItem, setCancelItem] = useState<DeliveryBoardItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stageGateBlocker, setStageGateBlocker] = useState<DeliveryBoardStageGateBlocker | null>(
    null,
  );

  const handleBoardAction = useCallback(
    async (item: DeliveryBoardItem, action: BoardAction) => {
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
    },
    [onRefresh],
  );

  const advanceToDeliveryStage = useCallback(
    async (item: DeliveryBoardItem, target: DeliveryActiveStage) => {
      const itemId = getItemId(item);
      setBusyItemId(itemId);
      setActionError(null);
      setStageGateBlocker(null);
      try {
        await advanceDeliveryItemToStage(item, target);
        await onRefresh();
      } catch (error) {
        if (isStageGateApiError(error)) {
          const pid = getProjectId(item);
          if (pid) setStageGateBlocker(toBoardStageGateBlocker(item, pid, error));
        } else {
          setActionError(
            toDeliveryBoardActionError(error, 'Could not move to the selected delivery stage.'),
          );
        }
      } finally {
        setBusyItemId(null);
      }
    },
    [onRefresh],
  );

  const handleCancelConfirm = useCallback(
    async (payload: DeliveryLifecycleActionPayload) => {
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
          setActionError(
            toDeliveryBoardActionError(error, 'Delivery item could not be cancelled.'),
          );
        }
      } finally {
        setBusyItemId(null);
      }
    },
    [cancelItem, onRefresh],
  );

  const clearActionDialog = useCallback(() => {
    setCancelItem(null);
    setActionError(null);
    setStageGateBlocker(null);
  }, []);

  const dismissStageGate = useCallback(() => {
    setStageGateBlocker(null);
  }, []);

  return {
    busyItemId,
    cancelItem,
    actionError,
    stageGateBlocker,
    handleBoardAction,
    advanceToDeliveryStage,
    requestCancel: setCancelItem,
    handleCancelConfirm,
    dismissStageGate,
    clearActionDialog,
  };
}
