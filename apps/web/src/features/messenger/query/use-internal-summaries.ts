'use client';

import { useQuery } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerInternalSection } from '@/lib/api/messenger-core';
import {
  deriveInternalVisibleSummaries,
  internalSummariesQueryKey,
  isInternalAllFamilyParams,
  resolveInternalSummaryParams,
  type InternalListFilter,
} from './derive-internal-summaries';
import type { InternalSummaryParams } from './messenger-query-keys';
import { useMessengerPersistQueriesEnabled } from '../persist/use-messenger-persist-queries-enabled';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from './messenger-query-policy';

export function useInternalSummaries(input: {
  section: MessengerInternalSection;
  search: string;
  filter: InternalListFilter;
  enabled: boolean;
}) {
  const persistReady = useMessengerPersistQueriesEnabled();
  const params = resolveInternalSummaryParams(input.section, input.search, input.filter);
  const query = useQuery({
    queryKey: internalSummariesQueryKey(input.section, input.search, input.filter),
    queryFn: () => fetchInternalSummaries(params),
    enabled: input.enabled && persistReady,
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
    placeholderData: (previousData, previousQuery) =>
      keepInternalSummaryPlaceholder(previousData, previousQuery, params),
  });
  const cachedItems = query.data?.items ?? [];
  return {
    ...query,
    items: deriveInternalVisibleSummaries(cachedItems, input.section, input.filter),
  };
}

async function fetchInternalSummaries(params: InternalSummaryParams) {
  if (params.source === 'all-dataset') {
    return messengerCoreApi.listConversations({ section: 'all' });
  }
  return messengerCoreApi.listConversations({
    section: params.section,
    q: params.q || undefined,
    filter: params.filter === 'all' ? undefined : params.filter,
  });
}

function keepInternalSummaryPlaceholder<T>(
  previousData: T | undefined,
  previousQuery: { queryKey: readonly unknown[] } | undefined,
  nextParams: InternalSummaryParams,
): T | undefined {
  if (!previousData || !previousQuery) return undefined;
  const previousParams = previousQuery.queryKey[3];
  if (!isInternalSummaryParams(previousParams)) return undefined;
  if (isInternalAllFamilyParams(previousParams) && isInternalAllFamilyParams(nextParams)) {
    return previousData;
  }
  if (
    previousParams.source === 'section' &&
    nextParams.source === 'section' &&
    previousParams.section === nextParams.section
  ) {
    return previousData;
  }
  return undefined;
}

function isInternalSummaryParams(value: unknown): value is InternalSummaryParams {
  if (!value || typeof value !== 'object') return false;
  return 'source' in value;
}
