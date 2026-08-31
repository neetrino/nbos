import { describe, expect, it, vi } from 'vitest';
import {
  WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX,
  WHATSAPP_CORE_UNKNOWN_RECONCILE_MS,
} from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { drainPendingWhatsAppCoreSends } from './messenger-wa-outbound-drain.ops';
import {
  dispatchWhatsAppCoreSendJob,
  markWhatsAppCoreSendExhausted,
} from './messenger-wa-outbound-dispatch.ops';
import { applyWhatsAppAck } from './messenger-wa-lifecycle.ops';

const CHAT = '37499111222@c.us';
const IDEMPOTENCY_KEY = `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`;
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-1',
  idempotencyKey: IDEMPOTENCY_KEY,
};

const connection = {
  requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
};

type CasArgs = { where: { status?: { in: string[] } }; data: { status: string } };

function prismaFor(status: string, hasWhatsAppRef = false) {
  return {
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'hi',
        status,
        deletedAt: null,
      }),
      create: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerMessageExternalRef: {
      createMany: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(hasWhatsAppRef ? { id: 'ref-1' } : null),
      findUnique: vi.fn().mockResolvedValue(hasWhatsAppRef ? { messageId: 'msg-1' } : null),
    },
    messengerCommand: { updateMany: vi.fn(), findMany: vi.fn() },
  };
}

function casPrisma(status: string) {
  const stored = { status };
  const prisma = {
    messengerMessage: {
      findUnique: vi.fn(async () => ({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'e1',
        senderNameSnapshot: 'Ada',
        content: 'hi',
        direction: 'OUTBOUND',
        status: stored.status,
        provenance: 'EMPLOYEE',
        replyToMessageId: null,
        threadRootMessageId: null,
        createdAt: new Date(),
        editedAt: null,
        deletedAt: null,
        attachments: [],
        mentions: [],
        referencesAsTarget: [],
      })),
      create: vi.fn(),
      updateMany: vi.fn(async ({ where, data }: CasArgs) => {
        const allowed = where.status?.in ?? [];
        if (!allowed.includes(stored.status)) return { count: 0 };
        stored.status = data.status;
        return { count: 1 };
      }),
    },
    messengerMessageExternalRef: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
    },
    messengerCommand: { updateMany: vi.fn(), findMany: vi.fn() },
  };
  return { prisma, stored };
}

describe('WhatsApp WAHA_UNAVAILABLE retry (FINDING-S8-10)', () => {
  it('throws WAHA_UNAVAILABLE and leaves the row SENDING, not OUTCOME_UNKNOWN', async () => {
    const { prisma, stored } = casPrisma('QUEUED');
    const client = {
      sendAccountTextMessage: vi
        .fn()
        .mockRejectedValue(new WhatsAppGatewayHttpError(503, 'WAHA_UNAVAILABLE', 'timeout')),
    };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB),
    ).rejects.toMatchObject({ code: 'WAHA_UNAVAILABLE', status: 503 });
    expect(stored.status).toBe('SENDING');
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'OUTCOME_UNKNOWN' } }),
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
  });

  it('throws GATEWAY_UNAVAILABLE the same way as HTTP 5xx', async () => {
    const { prisma, stored } = casPrisma('QUEUED');
    const client = {
      sendAccountTextMessage: vi
        .fn()
        .mockRejectedValue(
          new WhatsAppGatewayHttpError(503, 'WHATSAPP_GATEWAY_UNAVAILABLE', 'down'),
        ),
    };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB),
    ).rejects.toMatchObject({ code: 'WHATSAPP_GATEWAY_UNAVAILABLE' });
    expect(stored.status).toBe('SENDING');
  });

  it('marks OUTCOME_UNKNOWN, not FAILED, when WAHA_UNAVAILABLE is exhausted', async () => {
    const prisma = prismaFor('SENDING');
    await markWhatsAppCoreSendExhausted(
      prisma as never,
      'msg-1',
      new WhatsAppGatewayHttpError(503, 'WAHA_UNAVAILABLE', 'timeout'),
    );
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['QUEUED', 'SENDING'] } }),
        data: { status: 'OUTCOME_UNKNOWN' },
      }),
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
  });
});

describe('WhatsApp OUTCOME_UNKNOWN drain (FINDING-S8-10)', () => {
  const unknownRow = {
    conversationId: 'conv-1',
    resultMessageId: 'msg-1',
    idempotencyKey: IDEMPOTENCY_KEY,
    payload: { accountId: 'acc_a', chatId: CHAT },
  };

  function drainPrisma(pendingRows: (typeof unknownRow)[], unknownRows: (typeof unknownRow)[]) {
    return {
      messengerCommand: {
        findMany: vi.fn(async ({ where }: { where: { status?: string } }) => {
          if (where.status === 'PENDING') return pendingRows;
          if (where.status === 'OUTCOME_UNKNOWN') return unknownRows;
          return [];
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
  }

  it('enqueues 0 for an OUTCOME_UNKNOWN command when only PENDING rows are selected', async () => {
    const prisma = drainPrisma([], []);
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const enqueued = await drainPendingWhatsAppCoreSends(prisma as never, queue);
    expect(enqueued).toBe(0);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ status: 'PENDING' }) }),
    );
  });

  it('enqueues the same idempotencyKey for eligible OUTCOME_UNKNOWN without a WHATSAPP ref', async () => {
    const prisma = drainPrisma([], [unknownRow]);
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    const enqueued = await drainPendingWhatsAppCoreSends(prisma as never, queue);
    expect(enqueued).toBe(1);
    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'core_client_send',
        messageId: 'msg-1',
        idempotencyKey: IDEMPOTENCY_KEY,
      }),
      false,
    );
    expect(prisma.messengerCommand.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'OUTCOME_UNKNOWN',
          idempotencyKey: { startsWith: WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX },
          completedAt: { lte: expect.any(Date) },
          resultMessage: { is: { externalRefs: { none: { provider: 'WHATSAPP' } } } },
        }),
      }),
    );
    const unknownWhere = prisma.messengerCommand.findMany.mock.calls[1]?.[0]?.where as {
      completedAt: { lte: Date };
    };
    const ageMs = Date.now() - unknownWhere.completedAt.lte.getTime();
    expect(ageMs).toBeGreaterThanOrEqual(WHATSAPP_CORE_UNKNOWN_RECONCILE_MS - 50);
    expect(prisma.messengerCommand.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idempotencyKey: IDEMPOTENCY_KEY,
          status: 'OUTCOME_UNKNOWN',
        }),
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }),
    );
  });
});

describe('WhatsApp missing-ref recovery then ACK (FINDING-S8-10)', () => {
  it('writes the recovered ref so later ack:2 can be DELIVERED without a second Core persist', async () => {
    const { prisma, stored } = casPrisma('OUTCOME_UNKNOWN');
    const client = {
      sendAccountTextMessage: vi.fn().mockResolvedValue({
        chatId: CHAT,
        status: 'sent',
        messageId: 'wamid-1',
      }),
    };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).toHaveBeenCalledWith(
      expect.anything(),
      'acc_a',
      expect.anything(),
      IDEMPOTENCY_KEY,
    );
    expect(prisma.messengerMessageExternalRef.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ externalMessageId: 'wamid-1', messageId: 'msg-1' })],
      }),
    );
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(stored.status).toBe('OUTCOME_UNKNOWN');
    const ack = await applyWhatsAppAck(prisma as never, {
      accountId: 'acc_a',
      providerMessageId: 'wamid-1',
      ack: 2,
    });
    expect(ack.skipped).toBe(false);
    expect(stored.status).toBe('DELIVERED');
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
  });
});
