import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED,
  messengerSocketConversationRoom,
  messengerSocketUserRoom,
} from '@nbos/shared';
import type { MessengerCoreMessageDto } from './core/messenger-core.types';
import {
  evictEmployeeFromConversationRoom,
  publishPersistedCoreConversationMessage,
} from './messenger-gateway-fanout';

function persistedMessage(
  overrides: Partial<MessengerCoreMessageDto> = {},
): MessengerCoreMessageDto {
  return {
    id: 'm1',
    conversationId: 'wa-1',
    senderId: null,
    senderName: 'Client',
    content: 'from whatsapp',
    direction: 'INBOUND',
    status: 'SENT',
    provenance: 'PROVIDER',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date('2026-09-05T12:00:00.000Z'),
    editedAt: null,
    attachments: [],
    mentionedEmployeeIds: [],
    references: [],
    ...overrides,
  };
}

describe('evictEmployeeFromConversationRoom', () => {
  it('leaves only the conversation room and emits a non-sensitive signal on the user room', async () => {
    const leave = vi.fn();
    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });
    const server = {
      in: vi.fn().mockReturnValue({
        fetchSockets: vi.fn().mockResolvedValue([{ leave }]),
      }),
      to,
    };
    await evictEmployeeFromConversationRoom(server as never, 'e1', 'c1', 'INTERNAL');
    expect(leave).toHaveBeenCalledWith(messengerSocketConversationRoom('c1'));
    expect(leave).not.toHaveBeenCalledWith(messengerSocketUserRoom('e1'));
    expect(to).toHaveBeenCalledWith(messengerSocketUserRoom('e1'));
    expect(emit).toHaveBeenCalledWith(MESSENGER_WS_SERVER_CONVERSATION_ACCESS_CHANGED, {
      conversationId: 'c1',
      zone: 'INTERNAL',
    });
  });
});

describe('publishPersistedCoreConversationMessage', () => {
  it('emits the room event without waiting for a hanging fanout', async () => {
    const emitRoomMessage = vi.fn();
    let resolveFanout: (() => void) | undefined;
    const hanging = new Promise<void>((resolve) => {
      resolveFanout = resolve;
    });
    const scheduleSummaries = vi.fn(() => hanging);
    publishPersistedCoreConversationMessage({
      emitRoomMessage,
      scheduleSummaries,
      loadFacts: vi.fn(),
      logger: { error: vi.fn() } as unknown as Logger,
      message: persistedMessage(),
      knownFacts: { zone: 'CLIENT', conversationType: 'EXTERNAL' },
    });
    expect(emitRoomMessage).toHaveBeenCalledTimes(1);
    expect(scheduleSummaries).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(scheduleSummaries.mock.results[0]?.value).toBe(hanging);
    resolveFanout?.();
    await hanging;
  });

  it('loads zone/type from DB for inbound paths without trusted facts', async () => {
    const scheduleSummaries = vi.fn().mockResolvedValue(undefined);
    const loadFacts = vi.fn().mockResolvedValue({
      zone: 'CLIENT',
      conversationType: 'EXTERNAL',
    });
    const message = persistedMessage({ senderId: null });
    publishPersistedCoreConversationMessage({
      emitRoomMessage: vi.fn(),
      scheduleSummaries,
      loadFacts,
      logger: { error: vi.fn() } as unknown as Logger,
      message,
    });
    await vi.waitFor(() => {
      expect(loadFacts).toHaveBeenCalledWith('wa-1');
      expect(scheduleSummaries).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'wa-1',
          zone: 'CLIENT',
          senderId: null,
          lastMessagePreview: 'from whatsapp',
        }),
      );
    });
  });
});
