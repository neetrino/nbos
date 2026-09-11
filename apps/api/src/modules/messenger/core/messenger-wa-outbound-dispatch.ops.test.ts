import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { WhatsAppGatewayHttpError } from '../../integrations/whatsapp-gateway/whatsapp-gateway.errors';
import {
  dispatchWhatsAppCoreSendJob,
  markWhatsAppCoreSendExhausted,
} from './messenger-wa-outbound-dispatch.ops';
import { commandLockMocks } from './messenger-outbound-lock-test.util';

const CHAT = '37499111222@c.us';
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-1',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
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

function mappingMocks() {
  return {
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
  };
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
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerMessageExternalRef: {
      createMany: vi.fn(),
      findFirst: vi
        .fn()
        .mockResolvedValue(
          hasWhatsAppRef
            ? { id: 'ref-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }
            : null,
        ),
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
    },
    ...commandLockMocks(canonicalCommand()),
    ...mappingMocks(),
  };
}

function casPrisma(status: string, hasWhatsAppRef = false) {
  const stored = { status };
  const prisma = {
    messengerMessage: {
      findUnique: vi.fn(async () => ({
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'hi',
        status: stored.status,
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      })),
      updateMany: vi.fn(async ({ where, data }: CasArgs) => {
        const allowed = allowedStatuses(where.status);
        if (!allowed.includes(stored.status)) return { count: 0 };
        stored.status = data.status;
        return { count: 1 };
      }),
    },
    messengerMessageExternalRef: {
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi
        .fn()
        .mockResolvedValue(
          hasWhatsAppRef
            ? { id: 'ref-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }
            : null,
        ),
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
    },
    ...commandLockMocks(canonicalCommand()),
    ...mappingMocks(),
  };
  return { prisma, stored };
}

describe('WhatsApp core send missing provider id (FINDING-S8-08)', () => {
  it('does not mark SENT when Gateway returns sent without messageId; throws retryable HTTP_503', async () => {
    const prisma = prismaFor('QUEUED');
    const client = {
      sendAccountTextMessage: vi.fn().mockResolvedValue({ chatId: CHAT, status: 'sent' }),
    };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB),
    ).rejects.toMatchObject({ code: 'HTTP_503', status: 503 });
    expect(client.sendAccountTextMessage).toHaveBeenCalledWith(
      expect.anything(),
      'acc_a',
      expect.objectContaining({ chatId: CHAT, text: 'hi' }),
      JOB.idempotencyKey,
    );
    expect(prisma.messengerMessageExternalRef.createMany).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'SENT' } }),
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
  });

  it('does not no-op SENT when the WHATSAPP ref is missing', async () => {
    const { prisma, stored } = casPrisma('SENT');
    const client = {
      sendAccountTextMessage: vi
        .fn()
        .mockResolvedValue({ chatId: CHAT, status: 'sent', messageId: 'wamid-1' }),
    };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).toHaveBeenCalledWith(
      expect.anything(),
      'acc_a',
      expect.anything(),
      JOB.idempotencyKey,
    );
    expect(prisma.messengerMessageExternalRef.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ externalMessageId: 'wamid-1', messageId: 'msg-1' })],
      }),
    );
    expect(stored.status).toBe('SENT');
  });

  it('writes the recovered ref when status is already SENT/DELIVERED/READ', async () => {
    for (const status of ['SENT', 'DELIVERED', 'READ'] as const) {
      const { prisma, stored } = casPrisma(status);
      const client = {
        sendAccountTextMessage: vi
          .fn()
          .mockResolvedValue({ chatId: CHAT, status: 'sent', messageId: 'wamid-later' }),
      };
      await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
      expect(client.sendAccountTextMessage).toHaveBeenCalledTimes(1);
      expect(prisma.messengerMessageExternalRef.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [expect.objectContaining({ externalMessageId: 'wamid-later', messageId: 'msg-1' })],
        }),
      );
      expect(stored.status).toBe(status);
    }
  });

  it('leaves current status and does not throw when recovery still has no messageId', async () => {
    const { prisma, stored } = casPrisma('OUTCOME_UNKNOWN');
    const client = {
      sendAccountTextMessage: vi.fn().mockResolvedValue({ chatId: CHAT, status: 'sent' }),
    };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB),
    ).resolves.toBeUndefined();
    expect(stored.status).toBe('OUTCOME_UNKNOWN');
    expect(prisma.messengerMessageExternalRef.createMany).not.toHaveBeenCalled();
  });

  it('skips SENDING CAS when recovering a missing ref on SENT', async () => {
    const { prisma } = casPrisma('SENT');
    const client = {
      sendAccountTextMessage: vi
        .fn()
        .mockResolvedValue({ chatId: CHAT, status: 'sent', messageId: 'wamid-1' }),
    };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'SENDING' } }),
    );
  });
});

describe('WhatsApp core send 5xx exhaustion (FINDING-S8-09)', () => {
  it('rethrows HTTP_502 from dispatch and does not mark FAILED on that attempt', async () => {
    const prisma = prismaFor('QUEUED');
    const client = {
      sendAccountTextMessage: vi
        .fn()
        .mockRejectedValue(new WhatsAppGatewayHttpError(502, 'HTTP_502', 'bad gateway')),
    };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB),
    ).rejects.toMatchObject({ code: 'HTTP_502', status: 502 });
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'OUTCOME_UNKNOWN' } }),
    );
  });

  it('marks OUTCOME_UNKNOWN on HTTP_502 exhaustion of a SENDING row', async () => {
    const prisma = prismaFor('SENDING');
    await markWhatsAppCoreSendExhausted(
      prisma as never,
      'msg-1',
      new WhatsAppGatewayHttpError(502, 'HTTP_502', 'bad gateway'),
    );
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['QUEUED', 'SENDING'] } }),
        data: { status: 'OUTCOME_UNKNOWN' },
      }),
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'OUTCOME_UNKNOWN' }) }),
    );
  });

  it('does not call Gateway when OUTCOME_UNKNOWN already has a WHATSAPP ref', async () => {
    const prisma = prismaFor('OUTCOME_UNKNOWN', true);
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('still marks FAILED on disconnected session without throw', async () => {
    const prisma = prismaFor('QUEUED');
    const client = {
      sendAccountTextMessage: vi
        .fn()
        .mockRejectedValue(
          new WhatsAppGatewayHttpError(409, 'WHATSAPP_NOT_CONNECTED', 'not paired'),
        ),
    };
    await expect(
      dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB),
    ).resolves.toBeUndefined();
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
  });
});
