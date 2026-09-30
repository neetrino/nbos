import type { QueryClient } from '@tanstack/react-query';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';

/** Peer of a cached DIRECT thread, when the open conversation is a direct chat. */
export function findCachedDirectPeerId(
  queryClient: QueryClient,
  conversationId: string,
): string | null {
  for (const row of iterateCachedInternalConversations(queryClient)) {
    if (row.id === conversationId && row.type === 'DIRECT' && row.peerEmployeeId) {
      return row.peerEmployeeId;
    }
  }
  return null;
}

/** Instant lookup of an existing DIRECT thread from inbox cache. */
export function findCachedDirectConversationId(
  queryClient: QueryClient,
  peerEmployeeId: string,
): string | null {
  for (const row of iterateCachedInternalConversations(queryClient)) {
    if (row.type === 'DIRECT' && row.peerEmployeeId === peerEmployeeId) {
      return row.id;
    }
  }
  return null;
}

/** Peer employee ids with a favorited DIRECT conversation in inbox cache. */
export function collectCachedPinnedDirectPeerIds(queryClient: QueryClient): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const row of iterateCachedInternalConversations(queryClient)) {
    if (row.type !== 'DIRECT' || !row.isFavorite || !row.peerEmployeeId) continue;
    ids.add(row.peerEmployeeId);
  }
  return ids;
}

/** Unread counts keyed by DIRECT peer employee id (max across cache copies). */
export function collectCachedDirectUnreadByPeerId(
  queryClient: QueryClient,
): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  for (const row of iterateCachedInternalConversations(queryClient)) {
    if (row.type !== 'DIRECT' || !row.peerEmployeeId) continue;
    const unread = row.unreadCount ?? 0;
    if (unread <= 0) continue;
    const previous = map.get(row.peerEmployeeId) ?? 0;
    if (unread > previous) map.set(row.peerEmployeeId, unread);
  }
  return map;
}

/** Total Internal unread across conversations (deduped by conversation id). */
export function collectCachedInternalUnreadTotal(queryClient: QueryClient): number {
  return sumUnreadByConversationId(iterateCachedInternalConversations(queryClient));
}

/** Total Client unread across conversations (deduped by conversation id). */
export function collectCachedClientUnreadTotal(queryClient: QueryClient): number {
  return sumUnreadByConversationId(iterateCachedClientConversations(queryClient));
}

function sumUnreadByConversationId(
  rows: Iterable<Pick<MessengerCoreConversationRow, 'id' | 'unreadCount'>>,
): number {
  const byId = new Map<string, number>();
  for (const row of rows) {
    const unread = row.unreadCount ?? 0;
    const previous = byId.get(row.id) ?? 0;
    if (unread > previous) byId.set(row.id, unread);
  }
  let total = 0;
  for (const count of byId.values()) total += count;
  return total;
}

function* iterateCachedInternalConversations(
  queryClient: QueryClient,
): Generator<MessengerCoreConversationRow> {
  const queries = queryClient.getQueriesData<{ items?: MessengerCoreConversationRow[] }>({
    queryKey: messengerQueryKeys.internalSummariesRoot,
  });
  for (const [, data] of queries) {
    for (const row of data?.items ?? []) {
      yield row;
    }
  }
}

function* iterateCachedClientConversations(
  queryClient: QueryClient,
): Generator<MessengerCoreConversationRow> {
  const queries = queryClient.getQueriesData<{ items?: MessengerCoreConversationRow[] }>({
    queryKey: messengerQueryKeys.clientSummariesRoot,
  });
  for (const [, data] of queries) {
    for (const row of data?.items ?? []) {
      yield row;
    }
  }
}
