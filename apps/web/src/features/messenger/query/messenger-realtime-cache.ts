import type { QueryClient } from '@tanstack/react-query';
import type {
  MessengerWsConversationReadUpdatedPayload,
  MessengerWsConversationSummaryPayload,
} from '@nbos/shared';
import type {
  MessengerCoreCollectionRow,
  MessengerCoreConversationRow,
} from '@/lib/api/messenger-core';
import { invalidateMessengerSummaries, patchConversationUnread } from './messenger-cache';
import { messengerQueryKeys, type MessengerZone } from './messenger-query-keys';
import { reduceConversationSummary } from './messenger-realtime-order';
import {
  advanceReadWatermark,
  clearReadWatermark,
  getReadWatermark,
} from './messenger-realtime-watermarks';

/**
 * In-session monotonic summary apply. Older lastMessageAt cannot regress the row.
 * Phase 4 owns durable revisions and delta replay.
 */
export function applyMessengerRealtimeSummary(
  queryClient: QueryClient,
  zone: MessengerZone,
  payload: MessengerWsConversationSummaryPayload,
): void {
  if (payload.zone !== zone) return;
  advanceReadWatermark(queryClient, zone, payload.conversationId, payload.lastReadAt);
  const { found } = patchSummaryFromAbsolute(queryClient, zone, payload);
  if (!found) invalidateMessengerSummaries(queryClient, zone);
}

export function applyMessengerRealtimeRead(
  queryClient: QueryClient,
  zone: MessengerZone,
  payload: MessengerWsConversationReadUpdatedPayload,
): void {
  if (payload.zone !== zone) return;
  if (!advanceReadWatermark(queryClient, zone, payload.conversationId, payload.lastReadAt)) {
    return;
  }
  patchConversationUnread(queryClient, zone, payload.conversationId, payload.unreadCount);
}

export function recoverMessengerRealtimeQueries(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string | null,
): void {
  invalidateMessengerSummaries(queryClient, zone);
  if (!conversationId) return;
  void queryClient.invalidateQueries({ queryKey: messengerQueryKeys.messages(conversationId) });
}

export function applyMessengerAccessChanged(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
  payloadZone: MessengerZone,
  session?: { activeId: string | null; clearActive: () => void },
): boolean {
  if (payloadZone !== zone) return false;
  removeConversationFromSummaries(queryClient, zone, conversationId);
  queryClient.removeQueries({ queryKey: messengerQueryKeys.messages(conversationId) });
  purgeEntityAndCollectionCaches(queryClient, zone, conversationId);
  clearReadWatermark(queryClient, zone, conversationId);
  if (session && session.activeId === conversationId) session.clearActive();
  return true;
}

function patchSummaryFromAbsolute(
  queryClient: QueryClient,
  zone: MessengerZone,
  payload: MessengerWsConversationSummaryPayload,
): { found: boolean } {
  let found = false;
  const watermark = getReadWatermark(queryClient, zone, payload.conversationId);
  const root =
    zone === 'CLIENT'
      ? messengerQueryKeys.clientSummariesRoot
      : messengerQueryKeys.internalSummariesRoot;
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: root },
    (current) => {
      if (!current?.items) return current;
      const assigned = assignAbsoluteSummary(current.items, payload, watermark);
      if (!assigned) return current;
      found = true;
      return assigned === current.items ? current : { ...current, items: assigned };
    },
  );
  return { found };
}

function assignAbsoluteSummary(
  items: MessengerCoreConversationRow[],
  payload: MessengerWsConversationSummaryPayload,
  watermark: string | null,
): MessengerCoreConversationRow[] | null {
  const index = items.findIndex((row) => row.id === payload.conversationId);
  if (index < 0) return null;
  const current = items[index];
  if (!current) return null;
  const nextRow = reduceConversationSummary(current, payload, watermark);
  if (nextRow === current) return items;
  const next = items.map((row, rowIndex) => (rowIndex === index ? nextRow : row));
  return nextRow.lastMessageAt === current.lastMessageAt ? next : sortSummariesByRecent(next);
}

function removeConversationFromSummaries(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
): void {
  const root =
    zone === 'CLIENT'
      ? messengerQueryKeys.clientSummariesRoot
      : messengerQueryKeys.internalSummariesRoot;
  queryClient.setQueriesData<{ items: MessengerCoreConversationRow[] }>(
    { queryKey: root },
    (current) => {
      if (!current?.items) return current;
      const next = current.items.filter((row) => row.id !== conversationId);
      return next.length === current.items.length ? current : { ...current, items: next };
    },
  );
}

function purgeEntityAndCollectionCaches(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
): void {
  queryClient.removeQueries({
    predicate: (query) => {
      if (query.queryKey[0] !== 'messenger' || query.queryKey[1] !== 'internal') return false;
      if (query.queryKey[2] !== 'entity') return false;
      const data = query.state.data;
      return isConversationRow(data) && data.id === conversationId;
    },
  });
  queryClient.setQueriesData<MessengerCoreCollectionRow | MessengerCoreCollectionRow[]>(
    { queryKey: messengerQueryKeys.collections(zone) },
    (current) => stripCollectionCaches(current, conversationId),
  );
}

function stripCollectionCaches(
  current: MessengerCoreCollectionRow | MessengerCoreCollectionRow[] | undefined,
  conversationId: string,
): MessengerCoreCollectionRow | MessengerCoreCollectionRow[] | undefined {
  if (!current) return current;
  if (Array.isArray(current)) {
    return current.map((row) => stripCollectionConversation(row, conversationId));
  }
  return stripCollectionConversation(current, conversationId);
}

function stripCollectionConversation(
  current: MessengerCoreCollectionRow,
  conversationId: string,
): MessengerCoreCollectionRow {
  const items = current.items?.filter((item) => item.conversationId !== conversationId);
  const conversations = current.conversations?.filter((row) => row.id !== conversationId);
  if (items === current.items && conversations === current.conversations) return current;
  return { ...current, items, conversations };
}

function isConversationRow(value: unknown): value is MessengerCoreConversationRow {
  return Boolean(
    value && typeof value === 'object' && 'id' in value && typeof value.id === 'string',
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
