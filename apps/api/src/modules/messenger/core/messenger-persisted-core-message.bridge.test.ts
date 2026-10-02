import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessengerPersistedCoreMessageSubscriber } from '../messenger-persisted-core-message.subscriber';
import {
  MessengerPersistedCoreMessageBus,
  persistedCoreMessageFanout,
} from './messenger-persisted-core-message-bus';

const EVENT = { conversationId: 'conv-finance', messageId: 'msg-1' };

describe('persisted Core message fan-out', () => {
  it('uses Redis when a publisher exists and withholds a worker without one', () => {
    expect(persistedCoreMessageFanout('worker', true)).toBe('redis');
    expect(persistedCoreMessageFanout('scheduler', true)).toBe('redis');
    expect(persistedCoreMessageFanout('all', true)).toBe('redis');
    expect(persistedCoreMessageFanout('worker', false)).toBe('withheld');
    expect(persistedCoreMessageFanout('scheduler', false)).toBe('withheld');
    expect(persistedCoreMessageFanout('api', false)).toBe('withheld');
    expect(persistedCoreMessageFanout('all', false)).toBe('in-process');
  });
});

describe('MessengerPersistedCoreMessageBus', () => {
  const previousRole = process.env.PROCESS_ROLE;

  afterEach(() => {
    restoreRole(previousRole);
  });

  it('dispatches in-process only for local all', async () => {
    process.env.PROCESS_ROLE = 'all';
    const bus = new MessengerPersistedCoreMessageBus();
    const received: unknown[] = [];
    bus.subscribe((event) => {
      received.push(event);
    });
    await expect(bus.publish(EVENT)).resolves.toBe(true);
    await expect(bus.publish({ conversationId: ' ', messageId: 'msg-1' })).resolves.toBe(false);
    expect(received).toEqual([EVENT]);
  });

  it('does not pretend a worker-only process reached browsers', async () => {
    process.env.PROCESS_ROLE = 'worker';
    const bus = new MessengerPersistedCoreMessageBus();
    const received: unknown[] = [];
    bus.subscribe((event) => {
      received.push(event);
    });
    await expect(bus.publish(EVENT)).resolves.toBe(false);
    expect(received).toEqual([]);
  });
});

describe('MessengerPersistedCoreMessageSubscriber', () => {
  const previousRole = process.env.PROCESS_ROLE;

  afterEach(() => {
    restoreRole(previousRole);
  });

  it('publishes the reloaded QUEUED Client row and ignores other zones', async () => {
    const gateway = {
      publishPersistedCoreMessage: vi.fn(),
      emitCoreConversationMessage: vi.fn(),
    };
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(queuedRow())
      .mockResolvedValueOnce({ ...queuedRow(), conversation: { zone: 'INTERNAL' } });
    const subscriber = new MessengerPersistedCoreMessageSubscriber(
      { messengerMessage: { findUnique } } as never,
      new MessengerPersistedCoreMessageBus(),
      gateway as never,
    );
    await subscriber.publishLoaded(EVENT);
    await subscriber.publishLoaded(EVENT);
    expect(gateway.publishPersistedCoreMessage).toHaveBeenCalledTimes(1);
    expect(gateway.publishPersistedCoreMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-1',
        conversationId: 'conv-finance',
        status: 'QUEUED',
        provenance: 'SYSTEM',
        direction: 'OUTBOUND',
      }),
    );
    expect(gateway.emitCoreConversationMessage).not.toHaveBeenCalled();
  });

  it('subscribes on the API process and not on the worker', () => {
    const bus = new MessengerPersistedCoreMessageBus();
    const subscribe = vi.spyOn(bus, 'subscribe');
    const subscriber = new MessengerPersistedCoreMessageSubscriber({} as never, bus, {
      publishPersistedCoreMessage: vi.fn(),
    } as never);
    process.env.PROCESS_ROLE = 'worker';
    subscriber.onModuleInit();
    expect(subscribe).not.toHaveBeenCalled();
    process.env.PROCESS_ROLE = 'all';
    subscriber.onModuleInit();
    expect(subscribe).toHaveBeenCalledTimes(1);
  });
});

function queuedRow() {
  return {
    id: 'msg-1',
    conversationId: 'conv-finance',
    senderId: null,
    senderNameSnapshot: 'Finance',
    content: 'Please pay',
    direction: 'OUTBOUND',
    status: 'QUEUED',
    provenance: 'SYSTEM',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date('2026-04-15T07:00:00.000Z'),
    editedAt: null,
    deletedAt: null,
    attachments: [],
    mentions: [],
    referencesAsTarget: [],
    conversation: { zone: 'CLIENT' },
  };
}

function restoreRole(previous: string | undefined): void {
  if (previous === undefined) delete process.env.PROCESS_ROLE;
  else process.env.PROCESS_ROLE = previous;
}
