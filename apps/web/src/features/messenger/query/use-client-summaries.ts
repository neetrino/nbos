'use client';

import { useQuery } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import type {
  MessengerClientListFilter,
  MessengerClientProvider,
  MessengerClientSection,
} from '@/lib/api/messenger-core-client';
import { clientSummariesParams, messengerQueryKeys } from './messenger-query-keys';
import { useMessengerPersistQueriesEnabled } from '../persist/use-messenger-persist-queries-enabled';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from './messenger-query-policy';

export function useClientSummaries(input: {
  section: MessengerClientSection;
  search: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
  enabled: boolean;
}) {
  const persistReady = useMessengerPersistQueriesEnabled();
  const params = clientSummariesParams(input);
  return useQuery({
    queryKey: messengerQueryKeys.clientSummaries(params),
    queryFn: () =>
      messengerClientApi.listConversations({
        section: params.section,
        q: params.q || undefined,
        filter: params.filter === 'all' ? undefined : params.filter,
        provider: params.provider || undefined,
      }),
    enabled: input.enabled && persistReady,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      keepClientSummaryPlaceholder(previousData, previousQuery, params.section),
  });
}

function keepClientSummaryPlaceholder<T>(
  previousData: T | undefined,
  previousQuery: { queryKey: readonly unknown[] } | undefined,
  section: MessengerClientSection,
): T | undefined {
  if (!previousData || !previousQuery) return undefined;
  const previousParams = previousQuery.queryKey[3];
  if (!previousParams || typeof previousParams !== 'object') return undefined;
  if (!('section' in previousParams)) return undefined;
  return previousParams.section === section ? previousData : undefined;
}
