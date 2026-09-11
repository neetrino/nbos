import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';

const CHAT = '37499111222@c.us';
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

const connection = {
  requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 'tok' }),
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

function dispatchPrisma(input: { message?: object | null; mapping?: object | null }) {
  return {
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue(input.message ?? null),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue(input.mapping ?? null),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    $queryRaw: vi.fn(async () => [canonicalCommand()]),
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(canonicalCommand()),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(1),
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
  };
}

describe('WhatsApp core send adversarial prepare', () => {
  it('does not call Gateway for a missing message', async () => {
    const prisma = dispatchPrisma({ message: null });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'MISSING_MESSAGE' }),
      }),
    );
  });

  it('does not call Gateway when conversationIds mismatch', async () => {
    const prisma = dispatchPrisma({
      message: {
        id: 'msg-1',
        conversationId: 'other',
        content: 'hi',
        status: 'QUEUED',
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      },
    });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'CONVERSATION_MISMATCH' }),
      }),
    );
  });

  it('does not call Gateway for an Internal conversation command', async () => {
    const prisma = dispatchPrisma({
      message: {
        id: 'msg-1',
        conversationId: 'conv-c',
        content: 'hi',
        status: 'QUEUED',
        deletedAt: null,
        conversation: { zone: 'INTERNAL' },
      },
    });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ invalidReason: 'NON_CLIENT' }) }),
    );
  });

  it('does not call Gateway when payload routing is forged', async () => {
    const prisma = dispatchPrisma({
      message: {
        id: 'msg-1',
        conversationId: 'conv-c',
        content: 'hi',
        status: 'QUEUED',
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      },
      mapping: {
        externalAccountId: 'acc_real',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      },
    });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'FORGED_ROUTING' }),
      }),
    );
  });
});
