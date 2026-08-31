import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import { drainPendingWhatsAppCoreSends } from './messenger-wa-outbound-drain.ops';
import {
  dispatchWhatsAppCoreSendJob,
  markWhatsAppCoreSendExhausted,
} from './messenger-wa-outbound-dispatch.ops';
import { applyWhatsAppAck } from './messenger-wa-lifecycle.ops';
import { finalizeWhatsAppCoreOutbound } from './messenger-wa-outbound.ops';
import type { MessengerCoreMessageDto } from './messenger-core.types';

const CHAT = '37499111222@c.us';
const MAPPING = { externalAccountId: 'acc_a', externalConversationId: CHAT };

function outboundMessage(): MessengerCoreMessageDto {
  return {
    id: 'msg-1',
    conversationId: 'conv-c',
    senderId: 'e1',
    senderName: 'Ada',
    content: 'hi',
    direction: 'OUTBOUND',
    status: 'QUEUED',
    provenance: 'EMPLOYEE',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date(),
    editedAt: null,
    attachments: [],
    mentionedEmployeeIds: [],
    references: [],
  };
}

function prismaForOutbox() {
  return {
    messengerConversation: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'conv-c', zone: 'CLIENT' }),
    },
    messengerCommand: {
      upsert: vi.fn().mockResolvedValue({ id: 'cmd-1', status: 'PENDING' }),
      findMany: vi.fn(),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        ...outboundMessage(),
        senderNameSnapshot: 'Ada',
        mentions: [],
        referencesAsTarget: [],
      }),
    },
  };
}

describe('WhatsApp outbound enqueue (FINDING-S8-04)', () => {
  it('leaves PENDING when the queue is unavailable after persist', async () => {
    const prisma = prismaForOutbox();
    const queue = { isAvailable: vi.fn().mockReturnValue(false), enqueue: vi.fn() };
    await expect(
      finalizeWhatsAppCoreOutbound(
        prisma as never,
        queue as never,
        outboundMessage(),
        'e1',
        MAPPING,
      ),
    ).resolves.toMatchObject({ id: 'msg-1', status: 'QUEUED' });
    expect(prisma.messengerCommand.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: 'PENDING',
          idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
        }),
      }),
    );
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('drains PENDING core sends once the queue is available', async () => {
    const prisma = prismaForOutbox();
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    prisma.messengerCommand.findMany.mockImplementation(
      async ({ where }: { where: { status?: string } }) => {
        if (where.status !== 'PENDING') return [];
        return [
          {
            conversationId: 'conv-c',
            resultMessageId: 'msg-1',
            idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
            payload: { accountId: 'acc_a', chatId: CHAT },
          },
        ];
      },
    );
    const enqueued = await drainPendingWhatsAppCoreSends(prisma as never, queue);
    expect(enqueued).toBe(1);
    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'core_client_send',
        messageId: 'msg-1',
        chatId: CHAT,
      }),
      false,
    );
  });

  it('returns the persisted message when enqueue rejects after outbox (FINDING-S8-06)', async () => {
    const prisma = prismaForOutbox();
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockRejectedValue(new Error('redis down')),
    };
    const result = await finalizeWhatsAppCoreOutbound(
      prisma as never,
      queue as never,
      outboundMessage(),
      'e1',
      MAPPING,
    );
    expect(result).toMatchObject({ id: 'msg-1', status: 'QUEUED' });
    expect(prisma.messengerCommand.upsert).toHaveBeenCalled();
    expect(queue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'core_client_send', messageId: 'msg-1' }),
      false,
    );
    expect(queue.enqueue).not.toHaveBeenCalledWith(expect.anything(), true);
  });
});

describe('WhatsApp outbound worker wiring (FINDING-S8-04)', () => {
  it('drains PENDING on start/process and marks exhausted core sends', () => {
    const worker = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../../integrations/whatsapp-gateway/whatsapp-outbound-messages.worker.ts',
      ),
      'utf8',
    );
    expect(worker).toMatch(/drainPendingWhatsAppCoreSends/);
    expect(worker).toMatch(/markWhatsAppCoreSendExhausted/);
    expect(worker).toMatch(/isBullmqJobFinallyFailed/);
  });
});

describe('WhatsApp core-send exhaustion (FINDING-S8-04)', () => {
  function prismaFor(status: string) {
    return {
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-1',
          content: 'hi',
          status,
          deletedAt: null,
        }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      messengerMessageExternalRef: {
        createMany: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      messengerCommand: { updateMany: vi.fn() },
    };
  }

  const job = {
    kind: 'core_client_send' as const,
    chatId: CHAT,
    accountId: 'acc_a',
    messageId: 'msg-1',
    conversationId: 'conv-1',
    idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
  };

  it('marks FAILED when an unclassified worker throw is exhausted', async () => {
    const prisma = prismaFor('SENDING');
    await markWhatsAppCoreSendExhausted(prisma as never, 'msg-1', new Error('ECONNRESET'));
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['QUEUED', 'SENDING'] } }),
        data: { status: 'FAILED' },
      }),
    );
    expect(prisma.messengerCommand.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });

  it('does not overwrite SENT on exhaustion', async () => {
    const prisma = prismaFor('SENT');
    await markWhatsAppCoreSendExhausted(prisma as never, 'msg-1', new Error('late'));
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });

  it('does not overwrite DELIVERED or READ on exhaustion', async () => {
    for (const status of ['DELIVERED', 'READ'] as const) {
      const prisma = prismaFor(status);
      await markWhatsAppCoreSendExhausted(prisma as never, 'msg-1', new Error('late'));
      expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    }
  });

  it('rethrows unclassified send errors so BullMQ can retry', async () => {
    const prisma = prismaFor('QUEUED');
    const connection = {
      requireClientConfig: vi
        .fn()
        .mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
    };
    const client = { sendAccountTextMessage: vi.fn().mockRejectedValue(new Error('ECONNRESET')) };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, job),
    ).rejects.toThrow('ECONNRESET');
  });
});

type CasUpdateManyArgs = {
  where: { status?: { in: string[] } };
  data: { status: string };
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createCasPrisma(initialStatus: string, findStatus?: string) {
  const stored = { status: initialStatus };
  const prisma = {
    messengerMessageExternalRef: {
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      findFirst: vi.fn().mockResolvedValue(null),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerCommand: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    messengerMessage: {
      findUnique: vi.fn(async () => ({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'e1',
        senderNameSnapshot: 'Ada',
        content: 'hi',
        direction: 'OUTBOUND',
        status: findStatus ?? stored.status,
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
      update: vi.fn(async ({ data }: { data: { status: string } }) => {
        await delay(25);
        stored.status = data.status;
        return {};
      }),
      updateMany: vi.fn(async ({ where, data }: CasUpdateManyArgs) => {
        const allowed = where.status?.in ?? [];
        if (!allowed.includes(stored.status)) return { count: 0 };
        stored.status = data.status;
        return { count: 1 };
      }),
    },
  };
  return { prisma, stored };
}

const CORE_SEND_JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-1',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

describe('WhatsApp outbound CAS (FINDING-S8-05)', () => {
  it('concurrent ACK READ vs completeCoreSend finishes READ', async () => {
    const { prisma, stored } = createCasPrisma('SENDING');
    const connection = {
      requireClientConfig: vi
        .fn()
        .mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
    };
    let gatewayStarted: () => void = () => undefined;
    const gatewayInFlight = new Promise<void>((resolve) => {
      gatewayStarted = resolve;
    });
    const client = {
      sendAccountTextMessage: vi.fn().mockImplementation(async () => {
        gatewayStarted();
        await delay(10);
        return { messageId: 'wamid-1' };
      }),
    };
    const dispatching = dispatchWhatsAppCoreSendJob(
      prisma as never,
      connection as never,
      client as never,
      CORE_SEND_JOB,
    );
    await gatewayInFlight;
    await Promise.all([
      applyWhatsAppAck(prisma as never, {
        accountId: 'acc_a',
        providerMessageId: 'wamid-1',
        ack: 3,
      }),
      dispatching,
    ]);
    expect(stored.status).toBe('READ');
    expect(prisma.messengerMessageExternalRef.createMany).toHaveBeenCalled();
  });

  it('MESSAGE_OUTCOME_UNKNOWN after DELIVERED leaves DELIVERED', async () => {
    const { prisma, stored } = createCasPrisma('QUEUED');
    const connection = {
      requireClientConfig: vi
        .fn()
        .mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
    };
    const client = {
      sendAccountTextMessage: vi.fn().mockImplementation(async () => {
        stored.status = 'DELIVERED';
        throw new WhatsAppGatewayHttpError(503, 'MESSAGE_OUTCOME_UNKNOWN', 'unknown');
      }),
    };
    await dispatchWhatsAppCoreSendJob(
      prisma as never,
      connection as never,
      client as never,
      CORE_SEND_JOB,
    );
    expect(stored.status).toBe('DELIVERED');
  });

  it('SENDING write does not clobber DELIVERED (CAS count 0)', async () => {
    const { prisma, stored } = createCasPrisma('DELIVERED', 'QUEUED');
    const connection = {
      requireClientConfig: vi
        .fn()
        .mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
    };
    const client = { sendAccountTextMessage: vi.fn().mockResolvedValue({ messageId: 'wamid-1' }) };
    await dispatchWhatsAppCoreSendJob(
      prisma as never,
      connection as never,
      client as never,
      CORE_SEND_JOB,
    );
    expect(stored.status).toBe('DELIVERED');
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('writes the external ref before SENT and still upserts when SENT CAS is 0 (FINDING-S8-07)', async () => {
    const { prisma, stored } = createCasPrisma('SENDING');
    const order: string[] = [];
    prisma.messengerMessageExternalRef.createMany.mockImplementation(async () => {
      order.push('ref');
      return { count: 1 };
    });
    prisma.messengerMessage.updateMany.mockImplementation(
      async ({ where, data }: CasUpdateManyArgs) => {
        if (data.status === 'SENT') order.push('sent');
        const allowed = where.status?.in ?? [];
        if (!allowed.includes(stored.status)) return { count: 0 };
        stored.status = data.status;
        return { count: 1 };
      },
    );
    const connection = {
      requireClientConfig: vi
        .fn()
        .mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
    };
    const client = {
      sendAccountTextMessage: vi.fn().mockImplementation(async () => {
        stored.status = 'READ';
        return { messageId: 'wamid-1' };
      }),
    };
    await dispatchWhatsAppCoreSendJob(
      prisma as never,
      connection as never,
      client as never,
      CORE_SEND_JOB,
    );
    expect(stored.status).toBe('READ');
    expect(prisma.messengerMessageExternalRef.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ externalMessageId: 'wamid-1', messageId: 'msg-1' })],
      }),
    );
    expect(order.indexOf('ref')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('sent')).toBeGreaterThan(order.indexOf('ref'));
  });
});
