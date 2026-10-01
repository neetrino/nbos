import type { QueryClient } from '@tanstack/react-query';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';

export const ticketSourceQueryRoot = ['support', 'ticket-sources'] as const;

export function ticketSourceQueryKey(ticketId: string) {
  return [ticketSourceQueryRoot[0], ticketSourceQueryRoot[1], ticketId] as const;
}

export function invalidateTicketSourceList(queryClient: QueryClient, ticketId: string): void {
  void queryClient.invalidateQueries({ queryKey: ticketSourceQueryKey(ticketId) });
}

export function ticketSourceMessageCacheMatches(
  queryKey: readonly unknown[],
  conversationIds: readonly string[],
): boolean {
  const messageKey = messengerQueryKeys.messages('');
  if (queryKey[0] !== messageKey[0] || queryKey[1] !== messageKey[1]) return false;
  const conversationId = queryKey[2];
  return typeof conversationId === 'string' && conversationIds.includes(conversationId);
}

/**
 * Refetch open ticket source previews when a canonical message changes.
 * Does not create a conversation message cache.
 */
export function invalidateOpenTicketSourcesForCanonicalMessage(
  queryClient: QueryClient,
  message: { id: string; conversationId: string },
): void {
  const queries = queryClient.getQueryCache().findAll({ queryKey: [...ticketSourceQueryRoot] });
  for (const query of queries) {
    if (!ticketSourceDataIncludesMessage(query.state.data, message)) continue;
    void queryClient.invalidateQueries({ queryKey: query.queryKey });
  }
}

function ticketSourceDataIncludesMessage(
  data: unknown,
  message: { id: string; conversationId: string },
): boolean {
  if (!Array.isArray(data)) return false;
  return data.some((row) => sourceRowMatches(row, message));
}

function sourceRowMatches(row: unknown, message: { id: string; conversationId: string }): boolean {
  if (!row || typeof row !== 'object') return false;
  const record = row as { sourceMessageId?: unknown; sourceConversationId?: unknown };
  return (
    record.sourceMessageId === message.id && record.sourceConversationId === message.conversationId
  );
}
