import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateMessengerCollections,
  patchConversationFavorite,
  patchConversationUnread,
  upsertConversationSummary,
} from '@/features/messenger/query/messenger-cache';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';

export async function openInternalConversation(
  queryClient: QueryClient,
  conversationId: string,
  setActiveId: (id: string) => void,
  setOpenedConversation?: (row: MessengerCoreConversationRow) => void,
): Promise<void> {
  setActiveId(conversationId);
  const conversation = await messengerCoreApi.getConversation(conversationId);
  upsertConversationSummary(queryClient, 'INTERNAL', conversation);
  setOpenedConversation?.(conversation);
  await messengerCoreApi.markRead(conversationId);
  patchConversationUnread(queryClient, 'INTERNAL', conversationId, 0);
}

export async function toggleInternalFavorite(
  queryClient: QueryClient,
  conversationId: string,
): Promise<void> {
  const result = await messengerCoreApi.toggleFavorite(conversationId);
  patchConversationFavorite(queryClient, 'INTERNAL', conversationId, result.favorite);
  invalidateMessengerCollections(queryClient, 'INTERNAL', result.collectionId);
}
