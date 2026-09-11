import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { completeCoreSend, setCoreSendStatus } from './messenger-wa-outbound-complete.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';

const CHAT = '37499111222@c.us';
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

function command(overrides?: Record<string, unknown>) {
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

function racePrisma(input: {
  commandStatus?: string;
  messageStatus?: string;
  commandUpdateCount?: number;
  messageUpdateCount?: number;
}) {
  const cmd = command({ status: input.commandStatus ?? 'PENDING' });
  return {
    $queryRaw: vi.fn(async () => [{ ...cmd }]),
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(cmd),
      updateMany: vi.fn().mockResolvedValue({ count: input.commandUpdateCount ?? 0 }),
      update: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(input.commandUpdateCount ?? 0),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-c',
        content: 'hi',
        status: input.messageStatus ?? 'QUEUED',
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      }),
      updateMany: vi.fn().mockResolvedValue({ count: input.messageUpdateCount ?? 0 }),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(null),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
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

const connection = { requireClientConfig: vi.fn() };

describe('P4B-07 first-attempt claim races', () => {
  it('does not call Gateway when the command is already terminal', async () => {
    const prisma = racePrisma({ commandStatus: 'COMPLETED', commandUpdateCount: 0 });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('does not call Gateway when claim loses after a stale QUEUED prepare', async () => {
    const prisma = racePrisma({
      messageStatus: 'QUEUED',
      commandUpdateCount: 0,
      messageUpdateCount: 1,
    });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });

  it('loser of competing first attempts does not call Gateway', async () => {
    const prisma = racePrisma({ commandUpdateCount: 0, messageUpdateCount: 0 });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('does not call Gateway when ACK/ref completion wins the command first', async () => {
    const prisma = racePrisma({
      messageStatus: 'QUEUED',
      commandUpdateCount: 0,
      messageUpdateCount: 0,
    });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });
});

describe('P4B-10 paired transition ownership', () => {
  it('does not FAIL the message when command completion already won', async () => {
    const prisma = racePrisma({
      commandStatus: 'COMPLETED',
      messageStatus: 'QUEUED',
      commandUpdateCount: 0,
    });
    await setCoreSendStatus(
      prisma as never,
      command() as never,
      JOB,
      'FAILED',
      'WHATSAPP_NOT_CONNECTED',
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('does not invalidate a message after ACK proof wins the command', async () => {
    const prisma = racePrisma({
      commandStatus: 'COMPLETED',
      commandUpdateCount: 0,
      messageStatus: 'DELIVERED',
    });
    await markWhatsAppCommandInvalid(
      prisma as never,
      command() as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('completion-vs-failure flips a proven message command to COMPLETED', async () => {
    const prisma = racePrisma({
      commandUpdateCount: 1,
      messageStatus: 'DELIVERED',
    });
    await setCoreSendStatus(
      prisma as never,
      command() as never,
      JOB,
      'FAILED',
      'WHATSAPP_NOT_CONNECTED',
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'messenger.external_send_completed' }),
      }),
    );
  });

  it('scheduler invalid loses to a worker completion without mutating Message', async () => {
    const prisma = racePrisma({
      commandUpdateCount: 0,
      messageStatus: 'SENDING',
    });
    const held = command({
      dispatchToken: 'tok',
      nextReconcileAt: new Date(Date.now() + 30_000),
    });
    prisma.$queryRaw = vi.fn(async () => [{ ...held }]);
    await markWhatsAppCommandInvalid(
      prisma as never,
      command() as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED,
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('duplicate acceptance result does not mutate Message after the winner', async () => {
    const prisma = racePrisma({ commandUpdateCount: 0, messageStatus: 'SENDING' });
    await completeCoreSend(prisma as never, command() as never, JOB, 'wamid-1', false);
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});
