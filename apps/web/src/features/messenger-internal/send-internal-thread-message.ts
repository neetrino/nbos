import type { QueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { applyMessengerSendResult } from '@/features/messenger/query/messenger-cache';
import type { InternalSendExtras } from './InternalConversationThread';

export async function sendInternalThreadMessage(input: {
  conversationId: string | null;
  canWrite: boolean;
  sendBusy: boolean;
  content: string;
  extras: InternalSendExtras;
  setSendBusy: (busy: boolean) => void;
  setNewMessage: (value: string) => void;
  queryClient: QueryClient;
}): Promise<void> {
  if (!input.conversationId || !input.canWrite || input.sendBusy) return;
  const content = input.content.trim();
  const forwardIds = input.extras.forwardSourceIds ?? [];
  if (!content && forwardIds.length === 0) return;
  input.setSendBusy(true);
  try {
    if (forwardIds.length > 0) {
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
      return;
    }
    const message = await messengerCoreApi.sendMessage(input.conversationId, {
      content,
      replyToMessageId: input.extras.replyToMessageId,
      mentionedEmployeeIds: input.extras.mentionedEmployeeIds,
    });
    applyMessengerSendResult(input.queryClient, 'INTERNAL', message);
    input.setNewMessage('');
  } finally {
    input.setSendBusy(false);
  }
}
