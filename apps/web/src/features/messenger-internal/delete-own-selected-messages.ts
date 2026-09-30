import type { QueryClient } from '@tanstack/react-query';
import { removeMessengerMessages } from '@/features/messenger/query/messenger-cache';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';

export async function deleteOwnSelectedMessages(
  queryClient: QueryClient,
  selectedMessages: MessengerCoreMessageRow[],
  meId: string | null | undefined,
): Promise<void> {
  const ownIds = selectedMessages.filter((row) => row.senderId === meId).map((row) => row.id);
  if (ownIds.length === 0) return;
  const result = await messengerCoreApi.deleteOwnMessages(ownIds);
  removeMessengerMessages(queryClient, result.conversationId, result.deletedIds);
}
