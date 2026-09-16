import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELIVERY_BOARD_REFETCH_DEBOUNCE_MS } from './delivery-realtime.constants';
import { createDeliveryBoardRefetchScheduler } from './delivery-board-refetch-scheduler';

describe('createDeliveryBoardRefetchScheduler', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces rapid invalidations into a single refetch', async () => {
    vi.useFakeTimers();
    const refetch = vi.fn();
    const scheduler = createDeliveryBoardRefetchScheduler({
      isDocumentHidden: () => false,
      refetch,
    });

    scheduler.notifyChanged();
    scheduler.notifyChanged();
    scheduler.notifyChanged();
    expect(refetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(DELIVERY_BOARD_REFETCH_DEBOUNCE_MS - 1);
    expect(refetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(refetch).toHaveBeenCalledTimes(1);
    scheduler.dispose();
  });

  it('does not refetch while the document is hidden', async () => {
    vi.useFakeTimers();
    const refetch = vi.fn();
    let hidden = true;
    const scheduler = createDeliveryBoardRefetchScheduler({
      isDocumentHidden: () => hidden,
      refetch,
    });

    scheduler.notifyChanged();
    await vi.advanceTimersByTimeAsync(DELIVERY_BOARD_REFETCH_DEBOUNCE_MS * 2);
    expect(refetch).not.toHaveBeenCalled();

    hidden = false;
    scheduler.onVisibilityChange();
    expect(refetch).toHaveBeenCalledTimes(1);
    scheduler.dispose();
  });

  it('refreshes once on becoming visible after a burst while hidden', async () => {
    vi.useFakeTimers();
    const refetch = vi.fn();
    let hidden = true;
    const scheduler = createDeliveryBoardRefetchScheduler({
      isDocumentHidden: () => hidden,
      refetch,
    });

    scheduler.notifyChanged();
    scheduler.notifyChanged();
    scheduler.notifyChanged();
    expect(refetch).not.toHaveBeenCalled();

    hidden = false;
    scheduler.onVisibilityChange();
    expect(refetch).toHaveBeenCalledTimes(1);
    scheduler.dispose();
  });

  it('does not fire a pending debounce after dispose', async () => {
    vi.useFakeTimers();
    const refetch = vi.fn();
    const scheduler = createDeliveryBoardRefetchScheduler({
      isDocumentHidden: () => false,
      refetch,
    });

    scheduler.notifyChanged();
    scheduler.dispose();
    await vi.advanceTimersByTimeAsync(DELIVERY_BOARD_REFETCH_DEBOUNCE_MS * 2);
    expect(refetch).not.toHaveBeenCalled();
  });
});
