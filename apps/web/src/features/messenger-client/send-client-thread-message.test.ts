import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { clientOutboundDeliveryLabel } from './client-delivery-label';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { localSendReceiptLabel } from '@/features/messenger/query/messenger-local-send';
import {
  resetOptimisticCoreSendState,
  retryTrackedCoreSend,
} from '@/features/messenger/query/messenger-optimistic-send';
import { sendClientThreadMessage } from './send-client-thread-message';

vi.mock('@/lib/api/messenger-core-client', () => ({
  messengerClientApi: { sendMessage: vi.fn() },
}));

const sendMessage = vi.mocked(messengerClientApi.sendMessage);

function messageRow(
  id: string,
  conversationId: string,
  status: MessengerCoreMessageRow['status'],
): MessengerCoreMessageRow {
  return {
    id,
    conversationId,
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hello',
    createdAt: '2026-08-31T12:00:00.000Z',
    editedAt: null,
    status,
    direction: 'OUTBOUND',
    attachments: [],
  };
}

function sendInput(conversationId: string, queryClient: QueryClient) {
  return {
    conversationId,
    canSend: true,
    unlocked: true,
    unlockedConversationId: conversationId,
    content: 'hello',
    setNewMessage: vi.fn(),
    queryClient,
    senderId: 'e1',
    senderName: 'Ada',
  };
}

function items(queryClient: QueryClient, conversationId: string): MessengerCoreMessageRow[] {
  return (
    queryClient.getQueryData<MessengerMessagesPage>(messengerQueryKeys.messages(conversationId))
      ?.items ?? []
  );
}

describe('sendClientThreadMessage idempotency (FINDING-S8-06)', () => {
  beforeEach(() => {
    sendMessage.mockReset();
    resetOptimisticCoreSendState();
  });

  it('keeps a failed row and retries with the same key', async () => {
    const conversationId = `conv-${crypto.randomUUID()}`;
    const queryClient = new QueryClient();
    let rejectSend: (error: Error) => void = () => undefined;
    sendMessage.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectSend = reject;
      }),
    );
    const input = sendInput(conversationId, queryClient);
    const pending = sendClientThreadMessage(input);
    const optimistic = items(queryClient, conversationId)[0];
    expect(input.setNewMessage).toHaveBeenCalledWith('');
    expect(optimistic?.status).toBeUndefined();
    expect(optimistic?.direction).toBe('OUTBOUND');
    expect(localSendReceiptLabel(optimistic as MessengerCoreMessageRow)).toBe('Sending');
    expect(clientOutboundDeliveryLabel(optimistic as MessengerCoreMessageRow)).toBeNull();
    rejectSend(new Error('network'));
    await pending;
    const failed = items(queryClient, conversationId)[0];
    expect(failed?.content).toBe('hello');
    expect(failed?.status).toBeUndefined();
    expect(localSendReceiptLabel(failed as MessengerCoreMessageRow)).toBe('Not sent');
    const key = failed?.localSend?.idempotencyKey ?? '';
    sendMessage.mockResolvedValueOnce(messageRow('m1', conversationId, 'QUEUED'));
    await retryTrackedCoreSend(key);
    expect(sendMessage.mock.calls[0]?.[1].idempotencyKey).toBe(key);
    expect(sendMessage.mock.calls[1]?.[1].idempotencyKey).toBe(key);
    const saved = items(queryClient, conversationId)[0];
    expect(saved?.id).toBe('m1');
    expect(saved?.status).toBe('QUEUED');
    expect(saved?.status).not.toBe('DELIVERED');
    expect(saved?.status).not.toBe('READ');
    expect(clientOutboundDeliveryLabel(saved as MessengerCoreMessageRow)).toBe('Queued');
  });

  it('does not show provider delivered while the local row is still sending', () => {
    const row = messageRow('local', 'c1', 'DELIVERED');
    const optimistic: MessengerCoreMessageRow = {
      ...row,
      status: undefined,
      localSend: { idempotencyKey: 'k1', phase: 'sending' },
    };
    expect(localSendReceiptLabel(optimistic) ?? clientOutboundDeliveryLabel(optimistic)).toBe(
      'Sending',
    );
    expect(clientOutboundDeliveryLabel(messageRow('m1', 'c1', 'DELIVERED'))).toBe('Delivered');
    expect(clientOutboundDeliveryLabel(messageRow('m1', 'c1', 'FAILED'))).toBe('Failed');
  });

  it('does not send without canSend / unlock', async () => {
    const conversationId = `conv-${crypto.randomUUID()}`;
    await sendClientThreadMessage({
      ...sendInput(conversationId, new QueryClient()),
      canSend: false,
      unlocked: true,
      unlockedConversationId: conversationId,
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('patches the thread cache instead of refreshing the inbox', async () => {
    const conversationId = `conv-${crypto.randomUUID()}`;
    const queryClient = new QueryClient();
    sendMessage.mockResolvedValueOnce(messageRow('m1', conversationId, 'QUEUED'));
    await sendClientThreadMessage(sendInput(conversationId, queryClient));
    const page = items(queryClient, conversationId);
    expect(page).toHaveLength(1);
    expect(page[0]?.id).toBe('m1');
    expect(page[0]?.status).toBe('QUEUED');
  });
});
