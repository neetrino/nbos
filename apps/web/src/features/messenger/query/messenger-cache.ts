import type { QueryClient } from '@tanstack/react-query';
import { mergeCoreRealtimeMessage } from '@/features/messenger/merge-core-realtime-message';
import type { MessengerCoreConversationRow, MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import type { MessengerZone } from './messenger-query-keys';
import { messengerQueryKeys } from './messenger-query-keys';
import {
  clientSummaryMembership,
  internalSummaryMembership,
  isClientSummaryParams,
  isInternalSummaryParams,
  type SummaryMembership,
} from './summary-cache-membership';

export type MessengerMessagesPage = {
  items: MessengerCoreMessageRow[];
  meta: { hasMoreOlder: boolean };
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

export function applyMessengerSendResult(
  queryClient: QueryClient,
  zone: MessengerZone,
  message: MessengerCoreMessageRow,
): void {
  patchMessengerMessages(queryClient, message.conversationId, message, {
    createIfMissing: true,
  });
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

export function invalidateMessengerSummaries(
  queryClient: QueryClient,
  zone: MessengerZone,
): void {
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
    items.map((row) => (row.id === conversation.id ? { ...row, ...conversation } : row)),
  );
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
