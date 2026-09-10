import type { QueryClient } from '@tanstack/react-query';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import type { MessengerDeltaPage } from '@/lib/api/messenger-core-delta';
import { applyMessengerAccessChanged } from './messenger-realtime-cache';
import { upsertConversationSummary } from './messenger-cache';
import { messengerQueryKeys, type MessengerZone } from './messenger-query-keys';
import { clearReadWatermark } from './messenger-realtime-watermarks';

export type MessengerRecoverySession = {
  activeId: string | null;
  clearActive: () => void;
};

export function applyMessengerDeltaPages(
  queryClient: QueryClient,
  zone: MessengerZone,
  pages: Array<MessengerDeltaPage<MessengerCoreConversationRow>>,
  session?: MessengerRecoverySession,
): void {
  for (const page of pages) {
    applyDeltaSummaries(queryClient, zone, page.summaries);
    applyDeltaRemovals(queryClient, zone, page.removedConversationIds, session);
    invalidateChangedThreads(queryClient, zone, page, session);
  }
}

function applyDeltaSummaries(
  queryClient: QueryClient,
  zone: MessengerZone,
  summaries: MessengerCoreConversationRow[],
): void {
  for (const summary of summaries) {
    upsertConversationSummary(queryClient, zone, summary);
    clearReadWatermark(queryClient, zone, summary.id);
  }
}

function applyDeltaRemovals(
  queryClient: QueryClient,
  zone: MessengerZone,
  removedConversationIds: string[],
  session?: MessengerRecoverySession,
): void {
  for (const conversationId of removedConversationIds) {
    applyMessengerAccessChanged(queryClient, zone, conversationId, zone, session);
  }
}

function invalidateChangedThreads(
  queryClient: QueryClient,
  zone: MessengerZone,
  page: MessengerDeltaPage<MessengerCoreConversationRow>,
  session?: MessengerRecoverySession,
): void {
  const ids = new Set([...page.changedConversationIds, ...page.removedConversationIds]);
  for (const conversationId of ids) {
    if (!shouldInvalidateThread(queryClient, conversationId, session?.activeId ?? null)) continue;
    void queryClient.invalidateQueries({ queryKey: messengerQueryKeys.messages(conversationId) });
  }
  void zone;
}

function shouldInvalidateThread(
  queryClient: QueryClient,
  conversationId: string,
  activeId: string | null,
): boolean {
  if (activeId === conversationId) return true;
  return queryClient.getQueryState(messengerQueryKeys.messages(conversationId)) !== undefined;
}
