import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateMessengerCollections,
  patchConversationFavorite,
  patchConversationUnread,
  upsertConversationSummary,
} from '@/features/messenger/query/messenger-cache';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  messengerClientApi,
  type MessengerClientConversationRow,
} from '@/lib/api/messenger-core-client';

export async function openClientConversation(
  queryClient: QueryClient,
  conversationId: string,
  setActiveId: (id: string) => void,
  setOpenedConversation?: (row: MessengerClientConversationRow) => void,
): Promise<void> {
  setActiveId(conversationId);
  const conversation = await messengerClientApi.getConversation(conversationId);
  upsertConversationSummary(queryClient, 'CLIENT', conversation);
  setOpenedConversation?.(conversation);
  await messengerClientApi.markRead(conversationId);
  patchConversationUnread(queryClient, 'CLIENT', conversationId, 0);
}

export async function toggleClientFavorite(
  queryClient: QueryClient,
  conversationId: string,
): Promise<void> {
  const result = await messengerClientApi.toggleFavorite(conversationId);
  patchConversationFavorite(queryClient, 'CLIENT', conversationId, result.favorite);
  invalidateMessengerCollections(queryClient, 'CLIENT', result.collectionId);
}

export function patchClientAttention(
  queryClient: QueryClient,
  conversationId: string,
  attention: MessengerClientConversationRow['attention'],
): void {
  queryClient.setQueriesData<{ items: MessengerClientConversationRow[] }>(
    { queryKey: messengerQueryKeys.clientSummariesRoot },
    (current) => {
      if (!current?.items) return current;
      return {
        ...current,
        items: current.items.map((row) =>
          row.id === conversationId ? { ...row, attention } : row,
        ),
      };
    },
  );
}
