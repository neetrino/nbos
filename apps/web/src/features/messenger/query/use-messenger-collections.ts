'use client';

import { useQuery } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { messengerQueryKeys, type MessengerZone } from './messenger-query-keys';
import { useMessengerPersistQueriesEnabled } from '../persist/use-messenger-persist-queries-enabled';
import { MESSENGER_QUERY_GC_TIME_MS, MESSENGER_QUERY_STALE_TIME_MS } from './messenger-query-policy';

export function useMessengerCollections(zone: MessengerZone, enabled: boolean) {
  const persistReady = useMessengerPersistQueriesEnabled();
  return useQuery({
    queryKey: messengerQueryKeys.collections(zone),
    queryFn: () =>
      zone === 'CLIENT'
        ? messengerClientApi.listCollections()
        : messengerCoreApi.listCollections(),
    enabled: enabled && persistReady,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
}

export function useMessengerCollectionDetail(
  zone: MessengerZone,
  collectionId: string | null,
  enabled: boolean,
) {
  const id = collectionId ?? '';
  return useQuery({
    queryKey: messengerQueryKeys.collectionDetail(zone, id),
    queryFn: () =>
      zone === 'CLIENT' ? messengerClientApi.getCollection(id) : messengerCoreApi.getCollection(id),
    enabled: enabled && Boolean(collectionId),
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
}
