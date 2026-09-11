import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { completeCoreSend } from './messenger-wa-outbound-complete.ops';

const CHAT = '37499111222@c.us';
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

const TOKEN = 'tok-active';

function command() {
  return {
    id: 'cmd-1',
    conversationId: JOB.conversationId,
    resultMessageId: JOB.messageId,
    idempotencyKey: JOB.idempotencyKey,
    kind: 'SEND_MESSAGE',
    status: 'PENDING',
    payload: { accountId: JOB.accountId, chatId: JOB.chatId },
    firstAttemptAt: new Date(),
    createdAt: new Date(),
    invalidReason: null,
    nextReconcileAt: new Date(Date.now() + 30_000),
    dispatchToken: TOKEN,
    dispatchClaimedAt: new Date(),
  };
}

function refPrisma(input: {
  existingForMessage?: { externalMessageId: string; externalAccountId: string } | null;
  ownedMessageId?: string | null;
  auditThrow?: boolean;
}) {
  let rolledBack = false;
  const live = command();
  const tx = {
    $queryRaw: vi.fn(async () => [{ ...live }]),
    messengerCommand: {
      findUnique: vi.fn(async () => ({ ...live })),
      updateMany: vi
        .fn()
        .mockImplementation(async ({ data }: { data?: Record<string, unknown> }) => {
          if (data) Object.assign(live, data);
          return { count: 1 };
        }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(live, data);
        return live;
      }),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({ id: 'msg-1', status: 'SENDING' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn().mockResolvedValue(input.existingForMessage ?? null),
      createMany: vi
        .fn()
        .mockResolvedValue({ count: input.ownedMessageId === JOB.messageId ? 1 : 0 }),
      findUnique: vi
        .fn()
        .mockResolvedValue(input.ownedMessageId ? { messageId: input.ownedMessageId } : null),
    },
    auditLog: {
      create: input.auditThrow
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
  return { prisma, tx, rolledBack: () => rolledBack };
}

describe('P4B-12 provider ref ownership', () => {
  it('treats same-message duplicate provider id as idempotent SENT', async () => {
    const { prisma } = refPrisma({
      existingForMessage: { externalMessageId: 'wamid-1', externalAccountId: 'acc_a' },
      ownedMessageId: 'msg-1',
    });
    await completeCoreSend(
      prisma as never,
      command() as never,
      JOB,
      'wamid-1',
      false,
      undefined,
      TOKEN,
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('does not SENT/COMPLETE when the provider id belongs to another message', async () => {
    const { prisma } = refPrisma({
      existingForMessage: null,
      ownedMessageId: 'msg-other',
    });
    await completeCoreSend(
      prisma as never,
      command() as never,
      JOB,
      'wamid-stolen',
      false,
      undefined,
      TOKEN,
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'OUTCOME_UNKNOWN',
          invalidReason: 'PROVIDER_REF_CONFLICT',
          nextReconcileAt: null,
        }),
      }),
    );
    expect(prisma.messengerCommand.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('rejects a second different provider id on the same message', async () => {
    const { prisma } = refPrisma({
      existingForMessage: { externalMessageId: 'wamid-1', externalAccountId: 'acc_a' },
      ownedMessageId: 'msg-1',
    });
    await completeCoreSend(
      prisma as never,
      command() as never,
      JOB,
      'wamid-2',
      false,
      undefined,
      TOKEN,
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'PROVIDER_REF_CONFLICT' }),
      }),
    );
  });

  it('rolls back acceptance when the conflict audit fails', async () => {
    const { prisma, rolledBack } = refPrisma({
      existingForMessage: null,
      ownedMessageId: 'msg-other',
      auditThrow: true,
    });
    await expect(
      completeCoreSend(
        prisma as never,
        command() as never,
        JOB,
        'wamid-stolen',
        false,
        undefined,
        TOKEN,
      ),
    ).rejects.toThrow('audit_failed');
    expect(rolledBack()).toBe(true);
  });

  it('treats multiple different provider ids as a conflict, not SENT', async () => {
    const { prisma } = refPrisma({
      existingForMessage: { externalMessageId: 'wamid-1', externalAccountId: 'acc_a' },
      ownedMessageId: 'msg-1',
    });
    await completeCoreSend(
      prisma as never,
      command() as never,
      JOB,
      'wamid-1',
      false,
      undefined,
      TOKEN,
    );
    await completeCoreSend(
      prisma as never,
      command() as never,
      JOB,
      'wamid-2',
      false,
      undefined,
      TOKEN,
    );
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
    expect(prisma.messengerCommand.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invalidReason: 'PROVIDER_REF_CONFLICT' }),
      }),
    );
  });
});
