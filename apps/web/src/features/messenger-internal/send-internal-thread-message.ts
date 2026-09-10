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
  if (!content) return;
  input.setSendBusy(true);
  try {
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
