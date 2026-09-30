import type { QueryClient } from '@tanstack/react-query';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';

/** Instant lookup of an existing DIRECT thread from inbox cache. */
export function findCachedDirectConversationId(
  queryClient: QueryClient,
  peerEmployeeId: string,
): string | null {
  const queries = queryClient.getQueriesData<{ items?: MessengerCoreConversationRow[] }>({
    queryKey: messengerQueryKeys.internalSummariesRoot,
  });
  for (const [, data] of queries) {
    const hit = data?.items?.find(
      (row) => row.type === 'DIRECT' && row.peerEmployeeId === peerEmployeeId,
    );
    if (hit) return hit.id;
  }
  return null;
}
