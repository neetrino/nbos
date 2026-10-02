'use client';

import { useSyncExternalStore } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';

/** Inbox copy of a Task conversation, when Messenger has already loaded it. */
export function useCachedTaskConversationId(taskId: string | null): string | null {
  const queryClient = useQueryClient();
  return useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => readCachedTaskConversationId(queryClient, taskId),
    () => null,
  );
}

function readCachedTaskConversationId(
  queryClient: QueryClient,
  taskId: string | null,
): string | null {
  if (!taskId) return null;
  const canonicalKey = `task:${taskId}`;
  const queries = queryClient.getQueriesData<{
    items?: Array<{ id: string; canonicalKey?: string | null }>;
  }>({ queryKey: messengerQueryKeys.internalSummariesRoot });
  for (const [, data] of queries) {
    const match = data?.items?.find((row) => row.canonicalKey === canonicalKey);
    if (match) return match.id;
  }
  return null;
}
