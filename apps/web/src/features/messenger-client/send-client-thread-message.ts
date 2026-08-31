import { messengerClientApi } from '@/lib/api/messenger-core-client';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { isClientSendReady } from './client-composer-unlock';

export async function sendClientThreadMessage(input: {
  conversationId: string | null;
  canSend: boolean;
  unlocked: boolean;
  unlockedConversationId: string | null;
  sendBusy: boolean;
  content: string;
  replyToMessageId?: string;
  setSendBusy: (busy: boolean) => void;
  setMessages: (updater: (prev: MessengerCoreMessageRow[]) => MessengerCoreMessageRow[]) => void;
  setNewMessage: (value: string) => void;
  refreshLists: () => Promise<void>;
}): Promise<void> {
  if (
    !isClientSendReady({
      unlocked: input.unlocked,
      canSend: input.canSend,
      conversationId: input.conversationId,
      unlockedConversationId: input.unlockedConversationId,
    }) ||
    input.sendBusy
  ) {
    return;
  }
  const content = input.content.trim();
  if (!content || !input.conversationId) return;
  input.setSendBusy(true);
  try {
    const message = await messengerClientApi.sendMessage(input.conversationId, {
      content,
      replyToMessageId: input.replyToMessageId,
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
