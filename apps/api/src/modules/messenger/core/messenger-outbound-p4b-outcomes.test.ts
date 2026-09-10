import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';
import { completeCoreSend, setCoreSendStatus } from './messenger-wa-outbound-complete.ops';
import { repairWhatsAppRefProof } from './messenger-wa-outbound-repair.ops';
import { MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT } from './messenger-outbound-audit';

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

function outcomePrisma(options?: {
  messageStatus?: string;
  commandStatus?: string;
  hasRef?: boolean;
  auditThrow?: boolean;
  messageUpdateCount?: number;
  commandUpdateCount?: number;
}) {
  let rolledBack = false;
  const cmd = command({ status: options?.commandStatus ?? 'PENDING' });
  const tx = {
    $queryRaw: vi.fn(async () => [{ ...cmd }]),
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(cmd),
      updateMany: vi.fn().mockImplementation(async ({ data }: { data?: Record<string, unknown> }) => {
        if ((options?.commandUpdateCount ?? 1) === 0) return { count: 0 };
        if (data) Object.assign(cmd, data);
        return { count: 1 };
      }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(cmd, data);
        return cmd;
      }),
      count: vi.fn().mockResolvedValue(1),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-c',
        content: 'hi',
        status: options?.messageStatus ?? 'QUEUED',
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      }),
      updateMany: vi.fn().mockResolvedValue({ count: options?.messageUpdateCount ?? 1 }),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn().mockResolvedValue(
        options?.hasRef ? { id: 'ref-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' } : null,
      ),
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    auditLog: {
      create: options?.auditThrow
        ? vi.fn().mockRejectedValue(new Error('audit_failed'))
        : vi.fn().mockResolvedValue({ id: 'a1' }),
    },
  };
  const prisma = {
    ...tx,
    $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => {
      try {
        return await fn(tx);
      } catch (error) {
        rolledBack = true;
        throw error;
      }
    }),
  };
  return { prisma, tx, rolledBack: () => rolledBack, cmd };
}

describe('P4B-03 invalid message/command pairing', () => {
  it('FAILED both for pre-submit invalid QUEUED', async () => {
    const { prisma } = outcomePrisma({ messageStatus: 'QUEUED' });
    await markWhatsAppCommandInvalid(
      prisma as never,
      command() as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
    );
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', invalidReason: 'MALFORMED_PAYLOAD' }),
      }),
    );
  });

  it('OUTCOME_UNKNOWN both after a possible submit expires', async () => {
    const { prisma, cmd } = outcomePrisma({ messageStatus: 'SENDING' });
    cmd.firstAttemptAt = new Date();
    await markWhatsAppCommandInvalid(
      prisma as never,
      cmd as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.GATEWAY_WINDOW_EXPIRED,
    );
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'OUTCOME_UNKNOWN' } }),
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'OUTCOME_UNKNOWN',
          invalidReason: 'GATEWAY_WINDOW_EXPIRED',
          nextReconcileAt: null,
          completedAt: null,
        }),
      }),
    );
  });

  it('preserves DELIVERED and completes the command instead of FAILED', async () => {
    const { prisma } = outcomePrisma({
      messageStatus: 'DELIVERED',
      messageUpdateCount: 0,
    });
    await markWhatsAppCommandInvalid(
      prisma as never,
      command() as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });

  it('terminalizes a missing-message command without touching another message', async () => {
    const { prisma, cmd } = outcomePrisma({ messageUpdateCount: 0 });
    cmd.resultMessageId = null;
    await markWhatsAppCommandInvalid(
      prisma as never,
      cmd as never,
      { ...JOB, messageId: 'cmd-1' },
      MESSENGER_COMMAND_INVALID_REASON.MISSING_MESSAGE,
    );
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', invalidReason: 'MISSING_MESSAGE' }),
      }),
    );
  });
});

describe('P4B-04 proven ref never calls Gateway', () => {
  it.each(['QUEUED', 'SENDING', 'OUTCOME_UNKNOWN'] as const)(
    'repairs ref+%s to SENT with zero Gateway calls',
    async (status) => {
      const { prisma } = outcomePrisma({ messageStatus: status, hasRef: true });
      const client = { sendAccountTextMessage: vi.fn() };
      await dispatchWhatsAppCoreSendJob(
        prisma as never,
        { requireClientConfig: vi.fn() } as never,
        client as never,
        JOB,
      );
      expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
      expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'SENT' } }),
      );
    },
  );

  it('does not downgrade DELIVERED/READ when a ref exists', async () => {
    const { prisma } = outcomePrisma({
      messageStatus: 'DELIVERED',
      hasRef: true,
      messageUpdateCount: 0,
    });
    await repairWhatsAppRefProof(prisma as never, command() as never, JOB);
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'SENT' } }),
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });
});

describe('P4B-05 outcome audits are transactional', () => {
  it.each(['complete', 'failed', 'unknown', 'invalid'] as const)(
    'rolls back %s when audit write fails',
    async (kind) => {
      const { prisma, rolledBack } = outcomePrisma({ auditThrow: true });
      const cmd = command() as never;
      await expect(async () => {
        if (kind === 'complete') {
          await completeCoreSend(prisma as never, cmd, JOB, 'wamid-1', false);
          return;
        }
        if (kind === 'failed') {
          await setCoreSendStatus(prisma as never, cmd, JOB, 'FAILED', 'WHATSAPP_NOT_CONNECTED');
          return;
        }
        if (kind === 'unknown') {
          await setCoreSendStatus(prisma as never, cmd, JOB, 'OUTCOME_UNKNOWN', 'MESSAGE_OUTCOME_UNKNOWN');
          return;
        }
        await markWhatsAppCommandInvalid(
          prisma as never,
          cmd,
          JOB,
          MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
        );
      }).rejects.toThrow('audit_failed');
      expect(rolledBack()).toBe(true);
    },
  );

  it('does not write a duplicate completion audit on CAS no-op', async () => {
    const { prisma } = outcomePrisma({ messageUpdateCount: 0, commandUpdateCount: 0 });
    await completeCoreSend(prisma as never, command() as never, JOB, 'wamid-1', false);
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });
});

describe('P4B-06 mapping drift and monotonic commands', () => {
  it('FAILED both when mapping drifts before any provider attempt', async () => {
    const { prisma } = outcomePrisma({ messageStatus: 'QUEUED' });
    await markWhatsAppCommandInvalid(
      prisma as never,
      command({ firstAttemptAt: null }) as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.FORGED_ROUTING,
    );
    expect(prisma.messengerMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'FAILED' } }),
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED', invalidReason: 'FORGED_ROUTING' }),
      }),
    );
  });

  it('UNKNOWN expired when mapping drifts after a possible submit', async () => {
    const { prisma, cmd } = outcomePrisma({ messageStatus: 'SENDING' });
    cmd.firstAttemptAt = new Date();
    await markWhatsAppCommandInvalid(
      prisma as never,
      cmd as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.FORGED_ROUTING,
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'OUTCOME_UNKNOWN',
          invalidReason: 'GATEWAY_WINDOW_EXPIRED',
        }),
      }),
    );
  });
});

describe('P4B-06 canonical command is monotonic', () => {
  it('does not mutate a COMPLETED command from a stale job', async () => {
    const { prisma } = outcomePrisma({ commandStatus: 'COMPLETED' });
    const stale = { ...JOB, chatId: '37499000000@c.us', accountId: 'acc_forged' };
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(
      prisma as never,
      { requireClientConfig: vi.fn() } as never,
      client as never,
      stale,
    );
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.updateMany).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT,
        }),
      }),
    );
  });
});
