import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { resetOptimisticCoreSendState } from '@/features/messenger/query/messenger-optimistic-send';
import { noteMessengerComposerDraft } from '@/features/messenger/query/messenger-send-claim';
import { sendInternalThreadMessage } from './send-internal-thread-message';

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: { sendMessage: vi.fn() },
}));

const sendMessage = vi.mocked(messengerCoreApi.sendMessage);

describe('sendInternalThreadMessage', () => {
  beforeEach(() => {
    sendMessage.mockReset();
    resetOptimisticCoreSendState();
  });

  it('patches the thread by id and does not duplicate a repeated server id', async () => {
    const queryClient = new QueryClient();
    const message = {
      id: 'm1',
      conversationId: 'c1',
      senderId: 'e1',
      senderName: 'Ada',
      content: 'hello',
      createdAt: '2026-09-05T12:00:00.000Z',
      editedAt: null,
      attachments: [],
    };
    sendMessage.mockResolvedValue(message);
    const input = {
      conversationId: 'c1',
      canWrite: true,
      content: 'hello',
      extras: {},
      setNewMessage: vi.fn(),
      queryClient,
      senderId: 'e1',
      senderName: 'Ada',
    };
    await sendInternalThreadMessage(input);
    noteMessengerComposerDraft('c1', 'hello');
    await sendInternalThreadMessage(input);
    const page = queryClient.getQueryData<MessengerMessagesPage>(messengerQueryKeys.messages('c1'));
    expect(page?.items).toHaveLength(1);
    expect(page?.items[0]?.id).toBe('m1');
    expect(sendMessage.mock.calls[0]?.[1].idempotencyKey).toEqual(expect.any(String));
    expect(sendMessage.mock.calls[1]?.[1].idempotencyKey).not.toBe(
      sendMessage.mock.calls[0]?.[1].idempotencyKey,
    );
  });
});
