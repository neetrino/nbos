'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchMessengerBootstrapForNavKey } from '@/features/messenger/persist/messenger-bootstrap-prefetch';

export function useMessengerBootstrapPrefetch(moduleKey: string): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void prefetchMessengerBootstrapForNavKey(queryClient, moduleKey);
  }, [queryClient, moduleKey]);
}
