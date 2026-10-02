'use client';

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import {
  clientDefaultSummaryKey,
  internalDefaultSummaryKey,
} from '@/features/messenger/query/seed-messenger-bootstrap';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import {
  collectCachedClientUnreadTotal,
  collectCachedDirectUnreadByPeerId,
  collectCachedInternalUnreadTotal,
  collectCachedPinnedDirectPeerIds,
} from './find-cached-direct-conversation';

export type CachedDirectRailPeerState = {
  pinnedIds: ReadonlySet<string>;
  unreadByPeerId: ReadonlyMap<string, number>;
  internalUnreadTotal: number;
  clientUnreadTotal: number;
};

/** Observe Internal + Client summary caches for right-rail badges. */
export function useCachedDirectRailPeerState(enabled: boolean): CachedDirectRailPeerState {
  const queryClient = useQueryClient();
  const internal = useQuery({
    queryKey: internalDefaultSummaryKey(),
    queryFn: () => messengerCoreApi.listConversations({ section: 'all' }),
    enabled,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
  const client = useQuery({
    queryKey: clientDefaultSummaryKey(),
    queryFn: () => messengerClientApi.listConversations({ section: 'inbox' }),
    enabled,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });

  return useMemo(() => {
    void internal.data;
    void internal.dataUpdatedAt;
    void client.data;
    void client.dataUpdatedAt;
    return {
      pinnedIds: collectCachedPinnedDirectPeerIds(queryClient),
      unreadByPeerId: collectCachedDirectUnreadByPeerId(queryClient),
      internalUnreadTotal: collectCachedInternalUnreadTotal(queryClient),
      clientUnreadTotal: collectCachedClientUnreadTotal(queryClient),
    };
  }, [queryClient, internal.data, internal.dataUpdatedAt, client.data, client.dataUpdatedAt]);
}
