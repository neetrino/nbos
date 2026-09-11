import type { QueryClient } from '@tanstack/react-query';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { applyMessengerSendResult } from '@/features/messenger/query/messenger-cache';
import { isClientSendReady } from './client-composer-unlock';

const pendingClientSendKeys = new Map<string, string>();

export async function sendClientThreadMessage(input: {
  conversationId: string | null;
  canSend: boolean;
  unlocked: boolean;
  unlockedConversationId: string | null;
  sendBusy: boolean;
  content: string;
  replyToMessageId?: string;
  setSendBusy: (busy: boolean) => void;
  setNewMessage: (value: string) => void;
  queryClient: QueryClient;
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
  const conversationId = input.conversationId;
  const idempotencyKey = pendingOrCreateClientSendKey(conversationId);
  input.setSendBusy(true);
  try {
    const message = await messengerClientApi.sendMessage(conversationId, {
      content,
      replyToMessageId: input.replyToMessageId,
      idempotencyKey,
    });
    pendingClientSendKeys.delete(conversationId);
    applyMessengerSendResult(input.queryClient, 'CLIENT', message);
    input.setNewMessage('');
  } finally {
    input.setSendBusy(false);
  }
}

function pendingOrCreateClientSendKey(conversationId: string): string {
  const existing = pendingClientSendKeys.get(conversationId);
  if (existing) return existing;
  const key = crypto.randomUUID();
  pendingClientSendKeys.set(conversationId, key);
  return key;
}
