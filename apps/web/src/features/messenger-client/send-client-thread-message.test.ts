import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { sendClientThreadMessage } from './send-client-thread-message';

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: {
    sendMessage: vi.fn(),
  },
}));

const sendMessage = vi.mocked(messengerClientApi.sendMessage);

function messageRow(id: string, conversationId = 'conv-s8-06'): MessengerCoreMessageRow {
  return {
    id,
    conversationId,
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hello',
    createdAt: '2026-08-31T12:00:00.000Z',
    editedAt: null,
    status: 'QUEUED',
    direction: 'OUTBOUND',
    attachments: [],
  };
}

function sendInput(conversationId: string, queryClient = new QueryClient()) {
  return {
    conversationId,
    canSend: true,
    unlocked: true,
    unlockedConversationId: conversationId,
    sendBusy: false,
    content: 'hello',
    setSendBusy: vi.fn(),
    setNewMessage: vi.fn(),
    queryClient,
  };
}

describe('sendClientThreadMessage idempotency (FINDING-S8-06)', () => {
  beforeEach(() => {
    sendMessage.mockReset();
  });

  it('sends a stable idempotencyKey and reuses it after a failed attempt', async () => {
    const conversationId = `conv-${crypto.randomUUID()}`;
    sendMessage.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(messageRow('m1'));
    const first = sendInput(conversationId);
    await expect(sendClientThreadMessage(first)).rejects.toThrow('network');
    expect(first.setNewMessage).not.toHaveBeenCalled();

    const second = sendInput(conversationId, first.queryClient);
    await sendClientThreadMessage(second);
    expect(sendMessage).toHaveBeenCalledTimes(2);
    const firstKey = sendMessage.mock.calls[0]?.[1]?.idempotencyKey;
    const secondKey = sendMessage.mock.calls[1]?.[1]?.idempotencyKey;
    expect(firstKey).toEqual(expect.any(String));
    expect(firstKey?.length).toBeGreaterThan(0);
    expect(secondKey).toBe(firstKey);
    expect(second.setNewMessage).toHaveBeenCalledWith('');
  });

  it('does not send without canSend / unlock', async () => {
    const conversationId = `conv-${crypto.randomUUID()}`;
    await sendClientThreadMessage({
      ...sendInput(conversationId),
      canSend: false,
      unlocked: true,
      unlockedConversationId: conversationId,
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('patches the thread cache instead of refreshing the inbox', async () => {
    const conversationId = `conv-${crypto.randomUUID()}`;
    const queryClient = new QueryClient();
    sendMessage.mockResolvedValueOnce(messageRow('m1', conversationId));
    await sendClientThreadMessage(sendInput(conversationId, queryClient));
    const page = queryClient.getQueryData<MessengerMessagesPage>(
      messengerQueryKeys.messages(conversationId),
    );
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.id).toBe('m1');
  });
});
