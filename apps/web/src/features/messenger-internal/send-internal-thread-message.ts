import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import type { InternalSendExtras } from './InternalConversationThread';

export async function sendInternalThreadMessage(input: {
  conversationId: string | null;
  canWrite: boolean;
  sendBusy: boolean;
  content: string;
  extras: InternalSendExtras;
  setSendBusy: (busy: boolean) => void;
  setMessages: (updater: (prev: MessengerCoreMessageRow[]) => MessengerCoreMessageRow[]) => void;
  setNewMessage: (value: string) => void;
  refreshLists: () => Promise<void>;
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
    input.setMessages((prev) =>
      prev.some((row) => row.id === message.id) ? prev : [...prev, message],
    );
    input.setNewMessage('');
    await input.refreshLists();
  } finally {
    input.setSendBusy(false);
  }
}
