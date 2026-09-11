import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
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

function canonicalCommand(overrides?: Record<string, unknown>) {
  return {
    id: 'cmd-1',
    conversationId: JOB.conversationId,
    resultMessageId: JOB.messageId,
    idempotencyKey: JOB.idempotencyKey,
    kind: 'SEND_MESSAGE',
    status: 'PENDING',
    payload: { accountId: JOB.accountId, chatId: JOB.chatId },
    firstAttemptAt: null,
    createdAt: new Date(),
    invalidReason: null,
    nextReconcileAt: null,
    ...overrides,
  };
}

const connection = {
  requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
};

type CasArgs = { where: { status?: string | { in: string[] } }; data: { status: string } };

function allowedStatuses(status: CasArgs['where']['status']): string[] {
  if (typeof status === 'string') return [status];
  return status?.in ?? [];
}

function prismaFor(status: string, hasWhatsAppRef = false) {
  return {
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'hi',
        status,
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      }),
      create: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerMessageExternalRef: {
      createMany: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(hasWhatsAppRef ? { id: 'ref-1' } : null),
      findUnique: vi.fn().mockResolvedValue(hasWhatsAppRef ? { messageId: 'msg-1' } : null),
    },
    $queryRaw: vi.fn(async () => [canonicalCommand()]),
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(canonicalCommand()),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(1),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    auditLog: { create: vi.fn() },
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
        conversation: { zone: 'CLIENT' },
        attachments: [],
        mentions: [],
        referencesAsTarget: [],
      })),
      create: vi.fn(),
      updateMany: vi.fn(async ({ where, data }: CasArgs) => {
        const allowed = allowedStatuses(where.status);
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
    $queryRaw: vi.fn(async () => [
      canonicalCommand({ status: status === 'OUTCOME_UNKNOWN' ? 'OUTCOME_UNKNOWN' : 'PENDING' }),
    ]),
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(
        canonicalCommand({
          status: status === 'OUTCOME_UNKNOWN' ? 'OUTCOME_UNKNOWN' : 'PENDING',
        }),
      ),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(1),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    auditLog: { create: vi.fn() },
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
  const pendingRow = {
    id: 'cmd-1',
    conversationId: 'conv-1',
    resultMessageId: 'msg-1',
    idempotencyKey: IDEMPOTENCY_KEY,
    kind: 'SEND_MESSAGE',
    payload: { accountId: 'acc_a', chatId: CHAT },
    status: 'PENDING',
    createdAt: new Date(),
    nextReconcileAt: null,
  };

  function drainPrisma(rows: Array<typeof pendingRow>, messageStatus = 'QUEUED', hasRef = false) {
    return {
      $queryRaw: vi.fn(async () => (rows[0] ? [{ ...rows[0] }] : [])),
      messengerCommand: {
        findMany: vi.fn().mockResolvedValue(rows),
        findUnique: vi.fn().mockResolvedValue(rows[0] ?? null),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({}),
      },
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'hi',
          status: messageStatus,
          deletedAt: null,
          conversation: { zone: 'CLIENT' },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      messengerExternalConversationMapping: {
        findFirst: vi.fn().mockResolvedValue({
          externalAccountId: 'acc_a',
          externalConversationId: CHAT,
          conversation: { zone: 'CLIENT' },
        }),
      },
      messengerMessageExternalRef: {
        findFirst: vi.fn().mockResolvedValue(hasRef ? { id: 'ref-1' } : null),
      },
      auditLog: { create: vi.fn() },
    };
  }

  it('enqueues 0 when no candidate commands are selected', async () => {
    const prisma = drainPrisma([]);
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const enqueued = await drainPendingWhatsAppCoreSends(prisma as never, queue);
    expect(enqueued).toBe(0);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('enqueues the same idempotencyKey for eligible PENDING without a WHATSAPP ref', async () => {
    const prisma = drainPrisma([pendingRow]);
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
  });

  it('does not auto-submit OUTCOME_UNKNOWN after the Gateway 24h window', async () => {
    const prisma = drainPrisma(
      [
        {
          ...pendingRow,
          status: 'OUTCOME_UNKNOWN',
          createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        },
      ],
      'OUTCOME_UNKNOWN',
    );
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const enqueued = await drainPendingWhatsAppCoreSends(prisma as never, queue);
    expect(enqueued).toBe(0);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'GATEWAY_WINDOW_EXPIRED' }),
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
    expect(stored.status).toBe('SENT');
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
