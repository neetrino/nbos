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
} from './project-delivery-board-stage-gate';
import type { DeliveryStageGateResolution } from './delivery-stage-gate-resolution';
import {
  getItemId,
  getItemLifecycle,
  getProjectId,
  NEXT_DELIVERY_STAGE,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export interface UseDeliveryBoardMutationsResult {
  busyItemId: string | null;
  cancelItem: DeliveryBoardItem | null;
  actionError: string | null;
  stageGateResolution: DeliveryStageGateResolution | null;
  handleBoardAction: (item: DeliveryBoardItem, action: BoardAction) => Promise<void>;
  advanceToDeliveryStage: (item: DeliveryBoardItem, target: DeliveryActiveStage) => Promise<void>;
  requestCancel: (item: DeliveryBoardItem) => void;
  handleCancelConfirm: (payload: DeliveryLifecycleActionPayload) => Promise<void>;
  dismissStageGate: () => void;
  retryStageGateMove: () => Promise<void>;
  clearActionDialog: () => void;
}

export function useDeliveryBoardMutations(
  onRefresh: () => void | Promise<void>,
): UseDeliveryBoardMutationsResult {
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [cancelItem, setCancelItem] = useState<DeliveryBoardItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stageGateResolution, setStageGateResolution] =
    useState<DeliveryStageGateResolution | null>(null);

  const resolveGateFailure = useCallback(
    (item: DeliveryBoardItem, targetStage: DeliveryActiveStage, error: unknown) => {
      if (!isStageGateApiError(error)) return false;
      const pid = getProjectId(item);
      if (!pid) return false;
      setStageGateResolution({
        blocker: toBoardStageGateBlocker(item, pid, error),
        item,
        targetStage,
      });
      return true;
    },
    [],
  );

  const inferMoveNextTarget = useCallback((item: DeliveryBoardItem): DeliveryActiveStage | null => {
    const stage = getItemLifecycle(item)?.stage;
    if (!stage) return null;
    return NEXT_DELIVERY_STAGE[stage] ?? null;
  }, []);

  const handleBoardAction = useCallback(
    async (item: DeliveryBoardItem, action: BoardAction) => {
      const itemId = getItemId(item);
      setBusyItemId(itemId);
      setActionError(null);
      setStageGateResolution(null);
      const targetForGate = action === 'MOVE_NEXT' ? inferMoveNextTarget(item) : null;
      try {
        await runBoardAction(item, action);
        await onRefresh();
      } catch (error) {
        if (targetForGate && resolveGateFailure(item, targetForGate, error)) {
          return;
        }
        setActionError(toDeliveryBoardActionError(error, 'Delivery board action failed.'));
      } finally {
        setBusyItemId(null);
      }
    },
    [inferMoveNextTarget, onRefresh, resolveGateFailure],
  );

  const advanceToDeliveryStage = useCallback(
    async (item: DeliveryBoardItem, target: DeliveryActiveStage) => {
      const itemId = getItemId(item);
      setBusyItemId(itemId);
      setActionError(null);
      setStageGateResolution(null);
      try {
        await advanceDeliveryItemToStage(item, target);
        await onRefresh();
      } catch (error) {
        if (!resolveGateFailure(item, target, error)) {
          setActionError(
            toDeliveryBoardActionError(error, 'Could not move to the selected delivery stage.'),
          );
        }
      } finally {
        setBusyItemId(null);
      }
    },
    [onRefresh, resolveGateFailure],
  );

  const handleCancelConfirm = useCallback(
    async (payload: DeliveryLifecycleActionPayload) => {
      if (!cancelItem) return;
      const item = cancelItem;
      setBusyItemId(getItemId(item));
      setActionError(null);
      setStageGateResolution(null);
      try {
        await runBoardAction(item, 'CANCEL', payload);
        setCancelItem(null);
        await onRefresh();
      } catch (error) {
        setActionError(toDeliveryBoardActionError(error, 'Delivery item could not be cancelled.'));
      } finally {
        setBusyItemId(null);
      }
    },
    [cancelItem, onRefresh],
  );

  const clearActionDialog = useCallback(() => {
    setCancelItem(null);
    setActionError(null);
    setStageGateResolution(null);
  }, []);

  const dismissStageGate = useCallback(() => {
    setStageGateResolution(null);
  }, []);

  const retryStageGateMove = useCallback(async () => {
    if (!stageGateResolution) return;
    const { item, targetStage } = stageGateResolution;
    await advanceToDeliveryStage(item, targetStage);
  }, [advanceToDeliveryStage, stageGateResolution]);

  return {
    busyItemId,
    cancelItem,
    actionError,
    stageGateResolution,
    handleBoardAction,
    advanceToDeliveryStage,
    requestCancel: setCancelItem,
    handleCancelConfirm,
    dismissStageGate,
    retryStageGateMove,
    clearActionDialog,
  };
}
