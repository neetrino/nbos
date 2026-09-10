import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { sendInternalThreadMessage } from './send-internal-thread-message';

vi.mock('@/lib/api/messenger-core', () => ({
  messengerCoreApi: {
    sendMessage: vi.fn(),
  },
}));

const sendMessage = vi.mocked(messengerCoreApi.sendMessage);

describe('sendInternalThreadMessage', () => {
  it('patches the thread by id and does not duplicate on a second identical result', async () => {
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
    sendMessage.mockResolvedValueOnce(message).mockResolvedValueOnce(message);
    const input = {
      conversationId: 'c1',
      canWrite: true,
      sendBusy: false,
      content: 'hello',
      extras: {},
      setSendBusy: vi.fn(),
      setNewMessage: vi.fn(),
      queryClient,
    };
    await sendInternalThreadMessage(input);
    await sendInternalThreadMessage({ ...input, sendBusy: false });
    const page = queryClient.getQueryData<MessengerMessagesPage>(messengerQueryKeys.messages('c1'));
    expect(page?.items).toHaveLength(1);
  });
});
