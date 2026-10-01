import type { QueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { beginOptimisticCoreSend } from '@/features/messenger/query/messenger-optimistic-send';
import type { InternalSendExtras } from './InternalConversationThread';

export async function sendInternalThreadMessage(input: {
  conversationId: string | null;
  canWrite: boolean;
  content: string;
  extras: InternalSendExtras;
  setNewMessage: (value: string) => void;
  queryClient: QueryClient;
  senderId: string | null;
  senderName: string;
}): Promise<void> {
  if (!input.conversationId || !input.canWrite) return;
  const content = input.content.trim();
  const conversationId = input.conversationId;
  await beginOptimisticCoreSend({
    queryClient: input.queryClient,
    zone: 'INTERNAL',
    conversationId,
    content,
    senderId: input.senderId,
    senderName: input.senderName,
    replyToMessageId: input.extras.replyToMessageId,
    mentionedEmployeeIds: input.extras.mentionedEmployeeIds,
    onComposerClear: () => input.setNewMessage(''),
    transport: (idempotencyKey) =>
      postInternalMessage(conversationId, content, idempotencyKey, input.extras),
  });
}

async function postInternalMessage(
  conversationId: string,
  content: string,
  idempotencyKey: string,
  extras: InternalSendExtras,
) {
  const message = await messengerCoreApi.sendMessage(conversationId, {
    content,
    replyToMessageId: extras.replyToMessageId,
    mentionedEmployeeIds: extras.mentionedEmployeeIds,
    idempotencyKey,
  });
  return { message, conversationId };
}
