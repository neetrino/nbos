import { DELIVERY_BOARD_REFETCH_DEBOUNCE_MS } from './delivery-realtime.constants';

export type DeliveryBoardRefetchSchedulerHost = {
  isDocumentHidden: () => boolean;
  refetch: () => void;
  debounceMs?: number;
};

export type DeliveryBoardRefetchScheduler = {
  notifyChanged: () => void;
  onVisibilityChange: () => void;
  dispose: () => void;
};

type SchedulerState = {
  disposed: boolean;
  pendingWhileHidden: boolean;
  timer: ReturnType<typeof setTimeout> | null;
};

function clearSchedulerTimer(state: SchedulerState): void {
  if (state.timer === null) return;
  clearTimeout(state.timer);
  state.timer = null;
}

function runScheduledRefetch(state: SchedulerState, host: DeliveryBoardRefetchSchedulerHost): void {
  if (state.disposed) return;
  clearSchedulerTimer(state);
  if (host.isDocumentHidden()) {
    state.pendingWhileHidden = true;
    return;
  }
  state.pendingWhileHidden = false;
  host.refetch();
}

/**
 * Coalesces delivery-board SSE invalidations and defers refetch while the tab is hidden.
 */
export function createDeliveryBoardRefetchScheduler(
  host: DeliveryBoardRefetchSchedulerHost,
): DeliveryBoardRefetchScheduler {
  const debounceMs = host.debounceMs ?? DELIVERY_BOARD_REFETCH_DEBOUNCE_MS;
  const state: SchedulerState = {
    disposed: false,
    pendingWhileHidden: false,
    timer: null,
  };

  return {
    notifyChanged: () => {
      if (state.disposed) return;
      if (host.isDocumentHidden()) {
        state.pendingWhileHidden = true;
        clearSchedulerTimer(state);
        return;
      }
      clearSchedulerTimer(state);
      state.timer = setTimeout(() => {
        runScheduledRefetch(state, host);
      }, debounceMs);
    },
    onVisibilityChange: () => {
      if (state.disposed || host.isDocumentHidden() || !state.pendingWhileHidden) return;
      state.pendingWhileHidden = false;
      runScheduledRefetch(state, host);
    },
    dispose: () => {
      state.disposed = true;
      state.pendingWhileHidden = false;
      clearSchedulerTimer(state);
    },
  };
}
