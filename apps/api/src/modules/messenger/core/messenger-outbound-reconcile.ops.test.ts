import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { reconcileMessengerOutboundCommands } from './messenger-outbound-reconcile.ops';

const CHAT = '37499111222@c.us';
const KEY = `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`;

function pendingRow(overrides?: Record<string, unknown>) {
  return {
    id: 'cmd-1',
    conversationId: 'conv-c',
    resultMessageId: 'msg-1',
    idempotencyKey: KEY,
    payload: { accountId: 'acc_a', chatId: CHAT },
    status: 'PENDING',
    kind: 'SEND_MESSAGE',
    firstAttemptAt: null,
    invalidReason: null,
    createdAt: new Date(),
    nextReconcileAt: null,
    ...overrides,
  };
}

function clientMessage(status = 'QUEUED', zone = 'CLIENT') {
  return {
    id: 'msg-1',
    conversationId: 'conv-c',
    content: 'hi',
    status,
    deletedAt: null,
    conversation: { zone },
  };
}

function mapping() {
  return {
    externalAccountId: 'acc_a',
    externalConversationId: CHAT,
    conversation: { zone: 'CLIENT' },
  };
}

function reconcilePrisma(rows: ReturnType<typeof pendingRow>[], extras?: {
  message?: object | null;
  mapping?: object | null;
  ref?: object | null;
  poisonFirst?: boolean;
}) {
  let findUniqueCalls = 0;
  const live = rows[0] ? { ...rows[0] } : null;
  return {
    $queryRaw: vi.fn(async () => (live ? [{ ...live }] : [])),
    messengerCommand: {
      findMany: vi.fn().mockResolvedValue(rows),
      findUnique: vi.fn().mockResolvedValue(live),
      updateMany: vi.fn().mockImplementation(async ({ data }: { data?: Record<string, unknown> }) => {
        if (live && data) Object.assign(live, data);
        return { count: 1 };
      }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        if (live) Object.assign(live, data);
        return live;
      }),
    },
    messengerMessage: {
      findUnique: vi.fn(async () => {
        findUniqueCalls += 1;
        if (extras?.poisonFirst && findUniqueCalls === 1) throw new Error('poison');
        return extras?.message === undefined ? clientMessage() : extras.message;
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue(extras?.mapping === undefined ? mapping() : extras.mapping),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn().mockResolvedValue(extras?.ref ?? null),
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
  };
}

describe('Messenger outbound reconcile', () => {
  it('enqueues a valid PENDING QUEUED command and claims nextReconcileAt', async () => {
    const prisma = reconcilePrisma([pendingRow()]);
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.enqueued).toBe(1);
    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'core_client_send', idempotencyKey: KEY }),
      false,
    );
    expect(prisma.messengerCommand.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nextReconcileAt: expect.any(Date) }),
      }),
    );
  });

  it('leaves PENDING recoverable when the queue is unavailable', async () => {
    const prisma = reconcilePrisma([pendingRow()]);
    const queue = { isAvailable: vi.fn().mockReturnValue(false), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.enqueued).toBe(0);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.updateMany).not.toHaveBeenCalled();
  });

  it('does not treat queue failure as enqueue success', async () => {
    const prisma = reconcilePrisma([pendingRow()]);
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockRejectedValue(new Error('redis_down')),
    };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.enqueued).toBe(0);
    expect(counts.errors).toBe(1);
    expect(prisma.messengerCommand.updateMany).not.toHaveBeenCalled();
  });

  it('repairs a proven WHATSAPP ref without enqueueing Gateway', async () => {
    const prisma = reconcilePrisma([pendingRow()], {
      message: clientMessage('SENT'),
      ref: { id: 'ref-1' },
    });
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.repaired).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('retains OUTCOME_UNKNOWN beyond 24h as manual review and never auto-submits', async () => {
    const prisma = reconcilePrisma(
      [
        pendingRow({
          status: 'OUTCOME_UNKNOWN',
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        }),
      ],
      { message: clientMessage('OUTCOME_UNKNOWN') },
    );
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.manualReview).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'GATEWAY_WINDOW_EXPIRED' }),
      }),
    );
  });

  it('publishes UNKNOWN after expiry changes a stuck Message', async () => {
    const prisma = reconcilePrisma(
      [
        pendingRow({
          firstAttemptAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        }),
      ],
      { message: clientMessage('SENDING') },
    );
    const publisher = { publish: vi.fn() };
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    await reconcileMessengerOutboundCommands(prisma as never, queue, new Date(), publisher);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg-1', status: 'OUTCOME_UNKNOWN' }),
    );
  });

  it('does not publish a Message change when scheduler invalidates a malformed command', async () => {
    const prisma = reconcilePrisma([pendingRow({ payload: {} })]);
    const publisher = { publish: vi.fn() };
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    await reconcileMessengerOutboundCommands(prisma as never, queue, new Date(), publisher);
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', invalidReason: 'MALFORMED_PAYLOAD' }),
      }),
    );
  });

  it('publishes SENT after scheduler ref repair changes Message', async () => {
    const prisma = reconcilePrisma([pendingRow()], {
      message: clientMessage('SENDING'),
      ref: { id: 'ref-1' },
    });
    const publisher = { publish: vi.fn() };
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    await reconcileMessengerOutboundCommands(prisma as never, queue, new Date(), publisher);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg-1', status: 'SENT' }),
    );
  });

  it('isolates a poison row so later rows still enqueue', async () => {
    const prisma = reconcilePrisma(
      [
        pendingRow({
          id: 'cmd-bad',
          resultMessageId: 'msg-bad',
          idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-bad`,
        }),
        pendingRow({ id: 'cmd-ok' }),
      ],
      { poisonFirst: true },
    );
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.errors).toBe(1);
    expect(counts.enqueued).toBe(1);
  });

  it('does not call Gateway from the scheduler path', async () => {
    const prisma = reconcilePrisma([pendingRow()]);
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(prisma).not.toHaveProperty('sendAccountTextMessage');
  });

  it('second scheduler pass does not re-enqueue after a claim (empty candidate set)', async () => {
    const prisma = reconcilePrisma([pendingRow()]);
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    await reconcileMessengerOutboundCommands(prisma as never, queue);
    prisma.messengerCommand.findMany.mockResolvedValue([]);
    const second = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(queue.enqueue).toHaveBeenCalledTimes(1);
    expect(second.enqueued).toBe(0);
  });
});
