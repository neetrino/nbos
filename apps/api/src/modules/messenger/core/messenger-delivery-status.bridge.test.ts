import { describe, expect, it, vi } from 'vitest';
import { MessengerDeliveryStatusBus } from './messenger-delivery-status-bus';
import { isMessengerDeliveryStatusEvent } from './messenger-delivery-status.types';
import { MessengerDeliveryStatusSubscriber } from '../messenger-delivery-status.subscriber';

const VALID = {
  conversationId: 'conv-c',
  messageId: 'msg-1',
  status: 'SENT',
  occurredAt: '2026-09-05T12:00:00.000Z',
};

describe('Messenger delivery status event shape', () => {
  it('accepts id/status/timestamp payloads and rejects body or routing secrets', () => {
    expect(isMessengerDeliveryStatusEvent(VALID)).toBe(true);
    expect(isMessengerDeliveryStatusEvent({ ...VALID, status: 'NOPE' })).toBe(false);
    expect(isMessengerDeliveryStatusEvent({ conversationId: 'c', messageId: 'm' })).toBe(false);
    expect(
      isMessengerDeliveryStatusEvent({
        ...VALID,
        occurredAt: 'not-a-date',
      }),
    ).toBe(false);
  });
});

describe('MessengerDeliveryStatusBus process roles', () => {
  it('starts a Redis publisher for scheduler without requiring a subscriber', async () => {
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('./messenger-delivery-status-bus.ts', import.meta.url), 'utf8'),
    );
    expect(source).toMatch(/role === 'scheduler'/);
    expect(source).toMatch(/startSubscriber = role === 'api' \|\| role === 'all'/);
  });
});

describe('MessengerDeliveryStatusBus', () => {
  it('dispatches valid events in-process when Redis publisher is unset', async () => {
    const bus = new MessengerDeliveryStatusBus();
    const received: unknown[] = [];
    bus.subscribe((event) => received.push(event));
    await bus.publish(VALID);
    expect(received).toEqual([VALID]);
  });

  it('drops forged payloads', async () => {
    const bus = new MessengerDeliveryStatusBus();
    const received: unknown[] = [];
    bus.subscribe((event) => received.push(event));
    await bus.publish({ conversationId: '', messageId: 'msg-1', status: 'SENT', occurredAt: VALID.occurredAt });
    expect(received).toEqual([]);
  });
});

describe('MessengerDeliveryStatusSubscriber', () => {
  it('emits an absolute room update only for CLIENT messages matching the event', async () => {
    const prisma = {
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-c',
          senderId: 'e1',
          senderNameSnapshot: 'Ada',
          content: 'hi',
          direction: 'OUTBOUND',
          status: 'SENT',
          provenance: 'EMPLOYEE',
          replyToMessageId: null,
          threadRootMessageId: null,
          createdAt: new Date(),
          editedAt: null,
          attachments: [],
          mentions: [],
          referencesAsTarget: [],
          conversation: { zone: 'CLIENT' },
        }),
      },
    };
    const gateway = {
      emitCoreConversationMessage: vi.fn(),
      publishPersistedCoreMessage: vi.fn(),
    };
    const bus = new MessengerDeliveryStatusBus();
    const subscriber = new MessengerDeliveryStatusSubscriber(
      prisma as never,
      bus,
      gateway as never,
    );
    await subscriber.onDeliveryEvent(VALID);
    expect(gateway.emitCoreConversationMessage).toHaveBeenCalledWith(
      'conv-c',
      expect.objectContaining({ id: 'msg-1', status: 'SENT' }),
    );
    expect(gateway.publishPersistedCoreMessage).not.toHaveBeenCalled();
  });

  it('ignores Internal-zone reloads', async () => {
    const prisma = {
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-c',
          conversation: { zone: 'INTERNAL' },
        }),
      },
    };
    const gateway = { emitCoreConversationMessage: vi.fn(), publishPersistedCoreMessage: vi.fn() };
    const subscriber = new MessengerDeliveryStatusSubscriber(
      prisma as never,
      new MessengerDeliveryStatusBus(),
      gateway as never,
    );
    await subscriber.onDeliveryEvent(VALID);
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });
});
