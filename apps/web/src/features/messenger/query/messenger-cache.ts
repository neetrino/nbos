import type { QueryClient } from '@tanstack/react-query';
import { mergeCoreRealtimeMessage } from '@/features/messenger/merge-core-realtime-message';
import type {
  MessengerCoreConversationRow,
  MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import type { MessengerZone } from './messenger-query-keys';
import { messengerQueryKeys } from './messenger-query-keys';
import { compareIsoInstants } from './messenger-realtime-watermarks';
import {
  clientSummaryMembership,
  internalSummaryMembership,
  isClientSummaryParams,
  isInternalSummaryParams,
  type SummaryMembership,
} from './summary-cache-membership';

export type MessengerMessagesPage = {
  items: MessengerCoreMessageRow[];
  meta: { hasMoreOlder: boolean; peerLastReadAt?: string | null };
};

export function patchMessengerMessages(
  queryClient: QueryClient,
  conversationId: string,
  message: MessengerCoreMessageRow,
  options?: { createIfMissing?: boolean },
): void {
  const key = messengerQueryKeys.messages(conversationId);
  const current = queryClient.getQueryData<MessengerMessagesPage>(key);
  if (!current && !options?.createIfMissing) return;
  queryClient.setQueryData<MessengerMessagesPage>(key, (page) => ({
    items: mergeCoreRealtimeMessage(page?.items ?? [], message),
    meta: page?.meta ?? { hasMoreOlder: false },
  }));
}

/**
 * Reconciles a successful send into thread cache and inbox summaries.
 * Pass the canonical conversation row when the mutation can create a thread
 * that is not yet in the inbox snapshot. Without it, only an existing row is patched.
 */
export function applyMessengerSendResult(
  queryClient: QueryClient,
  zone: MessengerZone,
  message: MessengerCoreMessageRow,
  conversation?: MessengerCoreConversationRow,
): void {
  patchMessengerMessages(queryClient, message.conversationId, message, {
    createIfMissing: true,
  });
  if (conversation && conversation.id === message.conversationId) {
    upsertConversationSummary(queryClient, zone, conversation);
    return;
  }
  patchSummaryFromMessage(queryClient, zone, message);
}

function summariesRoot(zone: MessengerZone) {
  return zone === 'CLIENT'
    ? messengerQueryKeys.clientSummariesRoot
    : messengerQueryKeys.internalSummariesRoot;
}

export function patchSummaryFromMessage(
  queryClient: QueryClient,
  zone: MessengerZone,
  message: MessengerCoreMessageRow,
): { found: boolean } {
  let found = false;
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: summariesRoot(zone) },
    (current) => {
      if (!current?.items) return current;
      const next = applyMessageToSummaries(current.items, message);
      if (next === current.items) return current;
      found = true;
      return { ...current, items: next };
    },
  );
  return { found };
}

export function invalidateMessengerSummaries(queryClient: QueryClient, zone: MessengerZone): void {
  void queryClient.invalidateQueries({ queryKey: summariesRoot(zone) });
}

export function upsertConversationSummary(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversation: MessengerCoreConversationRow,
): void {
  const queries = queryClient.getQueryCache().findAll({ queryKey: summariesRoot(zone) });
  for (const query of queries) {
    applySummaryUpsertToQuery(queryClient, query.queryKey, conversation, zone);
  }
}

function applySummaryUpsertToQuery(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  conversation: MessengerCoreConversationRow,
  zone: MessengerZone,
): void {
  const current = queryClient.getQueryData<{ items: MessengerCoreConversationRow[] }>(queryKey);
  if (!current?.items) return;
  const existing = current.items.some((row) => row.id === conversation.id);
  if (existing) {
    queryClient.setQueryData(queryKey, {
      ...current,
      items: replaceExistingAndSort(current.items, conversation),
    });
    return;
  }
  const membership = summaryMembershipForKey(queryKey, conversation, zone);
  if (membership === 'insert') {
    queryClient.setQueryData(queryKey, {
      ...current,
      items: sortSummariesByRecent([conversation, ...current.items]),
    });
    return;
  }
  if (membership === 'unknown') {
    void queryClient.invalidateQueries({ queryKey, exact: true });
  }
}

function summaryMembershipForKey(
  queryKey: readonly unknown[],
  conversation: MessengerCoreConversationRow,
  zone: MessengerZone,
): SummaryMembership {
  const params = queryKey[3];
  if (zone === 'INTERNAL' && isInternalSummaryParams(params)) {
    return internalSummaryMembership(params, conversation);
  }
  if (zone === 'CLIENT' && isClientSummaryParams(params)) {
    return clientSummaryMembership(params, conversation);
  }
  return 'unknown';
}

export function patchConversationFavorite(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
  favorite: boolean,
): void {
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: summariesRoot(zone) },
    (current) => {
      if (!current?.items) return current;
      return {
        ...current,
        items: current.items.map((row) =>
          row.id === conversationId ? { ...row, isFavorite: favorite } : row,
        ),
      };
    },
  );
}

export function invalidateMessengerCollections(
  queryClient: QueryClient,
  zone: MessengerZone,
  collectionId?: string,
): void {
  void queryClient.invalidateQueries({ queryKey: messengerQueryKeys.collections(zone) });
  if (!collectionId) return;
  void queryClient.invalidateQueries({
    queryKey: messengerQueryKeys.collectionDetail(zone, collectionId),
  });
}

export function patchConversationUnread(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
  unreadCount: number,
): void {
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: summariesRoot(zone) },
    (current) => {
      if (!current?.items) return current;
      return {
        ...current,
        items: current.items.map((row) =>
          row.id === conversationId ? { ...row, unreadCount } : row,
        ),
      };
    },
  );
}

/** Marks the sidebar receipt as seen when a peer advances past our latest send. */
export {
  patchConversationLastMessageSeen,
  syncConversationListReceipt,
} from './messenger-list-receipt-cache';

export function applyMessengerRealtimeMessage(
  queryClient: QueryClient,
  message: MessengerCoreMessageRow,
): void {
  patchMessengerMessages(queryClient, message.conversationId, message);
}

function applyMessageToSummaries(
  items: MessengerCoreConversationRow[],
  message: MessengerCoreMessageRow,
): MessengerCoreConversationRow[] {
  const index = items.findIndex((row) => row.id === message.conversationId);
  if (index < 0) return items;
  return sortSummariesByRecent(
    items.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            lastMessageAt: message.createdAt,
            lastMessagePreview: message.content,
            lastMessageMine: true,
            lastMessageSeen: false,
          }
        : row,
    ),
  );
}

function replaceExistingAndSort(
  items: MessengerCoreConversationRow[],
  conversation: MessengerCoreConversationRow,
): MessengerCoreConversationRow[] {
  return sortSummariesByRecent(
    items.map((row) =>
      row.id === conversation.id ? mergeConversationSummaryRow(row, conversation) : row,
    ),
  );
}

function mergeConversationSummaryRow(
  current: MessengerCoreConversationRow,
  incoming: MessengerCoreConversationRow,
): MessengerCoreConversationRow {
  const currentAt = current.lastMessageAt;
  const incomingAt = incoming.lastMessageAt;
  if (currentAt && (!incomingAt || compareIsoInstants(incomingAt, currentAt) < 0)) {
    return {
      ...current,
      ...incoming,
      lastMessageAt: current.lastMessageAt,
      lastMessagePreview: current.lastMessagePreview,
      lastMessageMine: current.lastMessageMine,
      lastMessageSeen: current.lastMessageSeen,
      unreadCount: current.unreadCount,
    };
  }
  return {
    ...current,
    ...incoming,
    lastMessageAt: incomingAt ?? currentAt ?? null,
    lastMessagePreview:
      incoming.lastMessagePreview !== undefined
        ? incoming.lastMessagePreview
        : current.lastMessagePreview,
    lastMessageMine:
      incoming.lastMessageMine !== undefined ? incoming.lastMessageMine : current.lastMessageMine,
    lastMessageSeen:
      incoming.lastMessageSeen !== undefined ? incoming.lastMessageSeen : current.lastMessageSeen,
    unreadCount: incoming.unreadCount !== undefined ? incoming.unreadCount : current.unreadCount,
    peerEmployeeId:
      incoming.peerEmployeeId !== undefined ? incoming.peerEmployeeId : current.peerEmployeeId,
    peerName: incoming.peerName !== undefined ? incoming.peerName : current.peerName,
    peerPosition:
      incoming.peerPosition !== undefined ? incoming.peerPosition : current.peerPosition,
    isFavorite: incoming.isFavorite !== undefined ? incoming.isFavorite : current.isFavorite,
  };
}

function sortSummariesByRecent(
  items: MessengerCoreConversationRow[],
): MessengerCoreConversationRow[] {
  return [...items].sort((left, right) => {
    const leftAt = left.lastMessageAt ?? left.createdAt;
    const rightAt = right.lastMessageAt ?? right.createdAt;
    return rightAt.localeCompare(leftAt);
  });
}
