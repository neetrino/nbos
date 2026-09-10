'use client';

import { useQuery } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { messengerQueryKeys, type MessengerZone } from './messenger-query-keys';
import { MESSENGER_QUERY_GC_TIME_MS, MESSENGER_QUERY_STALE_TIME_MS } from './messenger-query-policy';
import type { MessengerMessagesPage } from './messenger-cache';

export function useMessengerMessages(
  conversationId: string | null,
  options: { enabled: boolean; zone: MessengerZone },
) {
  const id = conversationId ?? '';
  return useQuery({
    queryKey: messengerQueryKeys.messages(id),
    queryFn: () => fetchMessengerMessages(options.zone, id),
    enabled: options.enabled && Boolean(conversationId),
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
}

export function useObservedMessengerMessages(conversationId: string | null) {
  return useQuery({
    queryKey: messengerQueryKeys.messages(conversationId ?? '__idle__'),
    queryFn: async (): Promise<MessengerMessagesPage> => {
      throw new Error('observed messenger cache must not fetch');
    },
    enabled: false,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
}

async function fetchMessengerMessages(
  zone: MessengerZone,
  conversationId: string,
): Promise<MessengerMessagesPage> {
  if (zone === 'CLIENT') return messengerClientApi.listMessages(conversationId);
  return messengerCoreApi.listMessages(conversationId);
}
