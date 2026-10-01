import type { QueryClient } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { beginOptimisticCoreSend } from '@/features/messenger/query/messenger-optimistic-send';
import { isClientSendReady } from './client-composer-unlock';

export async function sendClientThreadMessage(input: {
  conversationId: string | null;
  canSend: boolean;
  unlocked: boolean;
  unlockedConversationId: string | null;
  content: string;
  replyToMessageId?: string;
  setNewMessage: (value: string) => void;
  queryClient: QueryClient;
  senderId: string | null;
  senderName: string;
}): Promise<void> {
  if (
    !isClientSendReady({
      unlocked: input.unlocked,
      canSend: input.canSend,
      conversationId: input.conversationId,
      unlockedConversationId: input.unlockedConversationId,
    })
  ) {
    return;
  }
  const content = input.content.trim();
  if (!content || !input.conversationId) return;
  const conversationId = input.conversationId;
  await beginOptimisticCoreSend({
    queryClient: input.queryClient,
    zone: 'CLIENT',
    conversationId,
    content,
    senderId: input.senderId,
    senderName: input.senderName,
    replyToMessageId: input.replyToMessageId,
    onComposerClear: () => input.setNewMessage(''),
    transport: (idempotencyKey) =>
      postClientMessage(conversationId, content, idempotencyKey, input.replyToMessageId),
  });
}

async function postClientMessage(
  conversationId: string,
  content: string,
  idempotencyKey: string,
  replyToMessageId: string | undefined,
) {
  const message = await messengerClientApi.sendMessage(conversationId, {
    content,
    replyToMessageId,
    idempotencyKey,
  });
  return { message, conversationId };
}
