'use client';

import { useCallback, useState } from 'react';
import { isStageGateApiError, type ApiFieldError } from '@/lib/api-errors';
import type { DeliveryLifecycleActionPayload } from '@/features/projects/components/DeliveryLifecycleActionDialog';
import {
  advanceDeliveryItemToStage,
  runBoardAction,
  type BoardAction,
  type DeliveryActiveStage,
} from './project-delivery-board-actions';
import {
  getLocalDeliveryCompleteErrors,
  getLocalDeliveryMoveNextErrors,
  getLocalDeliveryMoveStageErrors,
} from './delivery-stage-gate-client';
import { toDeliveryBoardActionError } from './project-delivery-board-stage-gate';
import {
  getItemId,
  getItemLifecycle,
  NEXT_DELIVERY_STAGE,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export interface UseDeliveryBoardMutationsOptions {
  onStageGateBlocked?: (
    item: DeliveryBoardItem,
    targetStage: DeliveryActiveStage,
    errors: ApiFieldError[],
  ) => void;
  onStageGateClear?: () => void;
}

export interface UseDeliveryBoardMutationsResult {
  busyItemId: string | null;
  cancelItem: DeliveryBoardItem | null;
  actionError: string | null;
  handleBoardAction: (item: DeliveryBoardItem, action: BoardAction) => Promise<void>;
  advanceToDeliveryStage: (item: DeliveryBoardItem, target: DeliveryActiveStage) => Promise<void>;
  requestCancel: (item: DeliveryBoardItem) => void;
  handleCancelConfirm: (payload: DeliveryLifecycleActionPayload) => Promise<void>;
  clearActionDialog: () => void;
}

export function useDeliveryBoardMutations(
  onRefresh: () => void | Promise<void>,
  options?: UseDeliveryBoardMutationsOptions,
): UseDeliveryBoardMutationsResult {
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [cancelItem, setCancelItem] = useState<DeliveryBoardItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const resolveGateFailure = useCallback(
    (item: DeliveryBoardItem, targetStage: DeliveryActiveStage, error: unknown) => {
      if (!isStageGateApiError(error)) return false;
      options?.onStageGateBlocked?.(item, targetStage, error.errors);
      return true;
    },
    [options],
  );

  const inferMoveNextTarget = useCallback((item: DeliveryBoardItem): DeliveryActiveStage | null => {
    const stage = getItemLifecycle(item)?.stage;
    if (!stage) return null;
    return NEXT_DELIVERY_STAGE[stage] ?? null;
  }, []);

  const blockLocalGate = useCallback(
    (item: DeliveryBoardItem, targetStage: DeliveryActiveStage, errors: ApiFieldError[]) => {
      options?.onStageGateBlocked?.(item, targetStage, errors);
    },
    [options],
  );

  const handleBoardAction = useCallback(
    async (item: DeliveryBoardItem, action: BoardAction) => {
      const itemId = getItemId(item);
      setBusyItemId(itemId);
      setActionError(null);
      const targetForGate = action === 'MOVE_NEXT' ? inferMoveNextTarget(item) : null;

      if (action === 'MOVE_NEXT' && targetForGate) {
        const localErrors = getLocalDeliveryMoveNextErrors(item);
        if (localErrors.length > 0) {
          blockLocalGate(item, targetForGate, localErrors);
          return;
        }
      }
      if (action === 'COMPLETE') {
        const localErrors = getLocalDeliveryCompleteErrors(item);
        if (localErrors.length > 0) {
          blockLocalGate(item, 'TRANSFER', localErrors);
          return;
        }
      }

      try {
        await runBoardAction(item, action);
        options?.onStageGateClear?.();
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
    [blockLocalGate, inferMoveNextTarget, onRefresh, options, resolveGateFailure],
  );

  const advanceToDeliveryStage = useCallback(
    async (item: DeliveryBoardItem, target: DeliveryActiveStage) => {
      const itemId = getItemId(item);
      setBusyItemId(itemId);
      setActionError(null);

      const localErrors = getLocalDeliveryMoveStageErrors(item, target);
      if (localErrors.length > 0) {
        blockLocalGate(item, target, localErrors);
        return;
      }

      try {
        await advanceDeliveryItemToStage(item, target);
        options?.onStageGateClear?.();
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
    [blockLocalGate, onRefresh, options, resolveGateFailure],
  );

  const handleCancelConfirm = useCallback(
    async (payload: DeliveryLifecycleActionPayload) => {
      if (!cancelItem) return;
      const item = cancelItem;
      setBusyItemId(getItemId(item));
      setActionError(null);
      try {
        await runBoardAction(item, 'CANCEL', payload);
        setCancelItem(null);
        options?.onStageGateClear?.();
        await onRefresh();
      } catch (error) {
        setActionError(toDeliveryBoardActionError(error, 'Delivery item could not be cancelled.'));
      } finally {
        setBusyItemId(null);
      }
    },
    [cancelItem, onRefresh, options],
  );

  const clearActionDialog = useCallback(() => {
    setCancelItem(null);
    setActionError(null);
  }, []);

  return {
    busyItemId,
    cancelItem,
    actionError,
    handleBoardAction,
    advanceToDeliveryStage,
    requestCancel: setCancelItem,
    handleCancelConfirm,
    clearActionDialog,
  };
}
