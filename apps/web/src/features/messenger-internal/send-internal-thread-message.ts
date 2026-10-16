import type { QueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { applyMessengerSendResult } from '@/features/messenger/query/messenger-cache';
import { beginOptimisticCoreSend } from '@/features/messenger/query/messenger-optimistic-send';
import type { InternalSendExtras } from './InternalConversationThread';

type InternalThreadSend = {
  conversationId: string | null;
  canWrite: boolean;
  content: string;
  extras: InternalSendExtras;
  setNewMessage: (value: string) => void;
  queryClient: QueryClient;
  senderId: string | null;
  senderName: string;
};

export async function sendInternalThreadMessage(input: InternalThreadSend): Promise<void> {
  if (!input.conversationId || !input.canWrite) return;
  const content = (input.extras.caption ?? input.content).trim();
  const forwardIds = input.extras.forwardSourceIds ?? [];
  const fileAssetIds = input.extras.fileAssetIds ?? [];
  if (!content && forwardIds.length === 0 && fileAssetIds.length === 0) return;
  if (forwardIds.length > 0) {
    await sendInternalForward(input, content, forwardIds);
    return;
  }
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
    allowBlankContent: fileAssetIds.length > 0,
    attachments: fileAssetIds.map((fileAssetId) => ({
      id: fileAssetId,
      fileAssetId,
      createdAt: new Date().toISOString(),
    })),
    onComposerClear: () => input.setNewMessage(''),
    transport: (idempotencyKey) =>
      postInternalMessage(conversationId, content, idempotencyKey, input.extras),
  });
}

async function sendInternalForward(
  input: InternalThreadSend,
  content: string,
  forwardIds: string[],
): Promise<void> {
  if (!input.conversationId) return;
  const result = await messengerCoreApi.forwardMessages(
    input.conversationId,
    forwardIds,
    content || undefined,
  );
  const holders = result.holders?.length ? result.holders : [result.holder];
  for (const holder of holders) {
    applyMessengerSendResult(input.queryClient, 'INTERNAL', holder);
  }
  if (result.commentMessage) {
    applyMessengerSendResult(input.queryClient, 'INTERNAL', result.commentMessage);
  }
  input.setNewMessage('');
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
    fileAssetIds: extras.fileAssetIds,
    idempotencyKey,
  });
  return { message, conversationId };
}
