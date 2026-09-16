'use client';

import { useEffect } from 'react';
import { connectDeliverySse } from '@/lib/realtime/connect-delivery-sse';
import { createDeliveryBoardRefetchScheduler } from '@/lib/realtime/delivery-board-refetch-scheduler';

/**
 * Subscribes to delivery-board invalidation SSE while the page is mounted.
 * Refetch is debounced and deferred while the tab is hidden.
 */
export function useDeliveryBoardRealtime(onRefetch: () => void | Promise<void>): void {
  useEffect(() => {
    const scheduler = createDeliveryBoardRefetchScheduler({
      isDocumentHidden: () => document.hidden,
      refetch: () => {
        void onRefetch();
      },
    });
    const session = connectDeliverySse({
      onItemChanged: () => {
        scheduler.notifyChanged();
      },
    });
    const onVisibility = () => {
      scheduler.onVisibilityChange();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      session.close();
      scheduler.dispose();
    };
  }, [onRefetch]);
}
