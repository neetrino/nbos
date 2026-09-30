'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { internalDefaultSummaryKey } from '@/features/messenger/query/seed-messenger-bootstrap';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import {
  collectCachedDirectUnreadByPeerId,
  collectCachedPinnedDirectPeerIds,
} from './find-cached-direct-conversation';

export type CachedDirectRailPeerState = {
  pinnedIds: ReadonlySet<string>;
  unreadByPeerId: ReadonlyMap<string, number>;
};

/**
 * Observe the default Internal summary query so rail badges follow bootstrap
 * and realtime patches without a cache-subscription setState loop.
 */
export function useCachedDirectRailPeerState(enabled: boolean): CachedDirectRailPeerState {
  const queryClient = useQueryClient();
  const summaries = useQuery({
    queryKey: internalDefaultSummaryKey(),
    queryFn: () => messengerCoreApi.listConversations({ section: 'all' }),
    enabled,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });

  return useMemo(() => {
    void summaries.data;
    void summaries.dataUpdatedAt;
    return {
      pinnedIds: collectCachedPinnedDirectPeerIds(queryClient),
      unreadByPeerId: collectCachedDirectUnreadByPeerId(queryClient),
    };
  }, [queryClient, summaries.data, summaries.dataUpdatedAt]);
}
