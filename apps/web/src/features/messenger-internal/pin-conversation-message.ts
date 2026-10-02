import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { patchConversationPinnedMessage } from '@/features/messenger/query/messenger-cache';
import { messengerCoreApi } from '@/lib/api/messenger-core';

export async function pinConversationMessage(
  queryClient: QueryClient,
  conversationId: string,
  messageId: string,
): Promise<void> {
  try {
    const pinned = await messengerCoreApi.pinMessage(conversationId, messageId);
    patchConversationPinnedMessage(queryClient, 'INTERNAL', conversationId, pinned);
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error, 'Could not pin that message.'));
  }
}

export async function unpinConversationMessage(
  queryClient: QueryClient,
  conversationId: string,
): Promise<void> {
  await messengerCoreApi.unpinMessage(conversationId);
  patchConversationPinnedMessage(queryClient, 'INTERNAL', conversationId, null);
}
