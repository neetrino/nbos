import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { sendClientThreadMessage } from './send-client-thread-message';

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: {
    sendMessage: vi.fn(),
  },
}));

const sendMessage = vi.mocked(messengerClientApi.sendMessage);

function messageRow(id: string): MessengerCoreMessageRow {
  return {
    id,
    conversationId: 'conv-s8-06',
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

function sendInput(conversationId: string) {
  return {
    conversationId,
    canSend: true,
    unlocked: true,
    unlockedConversationId: conversationId,
    sendBusy: false,
    content: 'hello',
    setSendBusy: vi.fn(),
    setMessages: vi.fn(),
    setNewMessage: vi.fn(),
    refreshLists: vi.fn().mockResolvedValue(undefined),
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

    const second = sendInput(conversationId);
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
});
