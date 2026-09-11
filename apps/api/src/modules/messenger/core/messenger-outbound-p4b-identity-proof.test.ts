import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { applyWhatsAppAck } from './messenger-wa-lifecycle.ops';
import { completeCoreSend } from './messenger-wa-outbound-complete.ops';
import { repairWhatsAppRefProof } from './messenger-wa-outbound-repair.ops';
import { lockedCommandMatchesResolvedMessage } from './messenger-outbound-command-lock';
import { MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED } from './messenger-outbound-audit';

const JOB = {
  kind: 'core_client_send' as const,
  chatId: '37499111222@c.us',
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
    firstAttemptAt: new Date(),
    createdAt: new Date(),
    invalidReason: null as string | null,
    nextReconcileAt: new Date(Date.now() + 30_000),
    dispatchToken: 'tok',
    dispatchClaimedAt: new Date(),
    ...overrides,
  };
}

function proofPrisma(input: {
  command?: Record<string, unknown>;
  messageStatus?: string;
  refs?: Array<{ messageId: string; externalMessageId: string; externalAccountId: string }>;
  ownedMessageId?: string | null;
  auditThrow?: boolean;
}) {
  const live = command(input.command);
  const message = {
    id: 'msg-1',
    conversationId: 'conv-c',
    status: input.messageStatus ?? 'SENDING',
  };
  const refs = [...(input.refs ?? [])];
  const audits: unknown[] = [];
  let rolledBack = false;
  const tx = {
    $queryRaw: vi.fn(async () => [{ ...live }]),
    messengerCommand: {
      findUnique: vi.fn(async () => ({ ...live })),
      updateMany: vi.fn(),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(live, data);
        return live;
      }),
    },
    messengerMessage: {
      findUnique: vi.fn(async () => ({
        ...message,
        attachments: [],
        mentions: [],
        referencesAsTarget: [],
      })),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id?: string; status?: { in: string[] } };
          data: { status: string };
        }) => {
          if (where.id && where.id !== message.id) return { count: 0 };
          const allowed = where.status?.in ?? [];
          if (allowed.length && !allowed.includes(message.status)) return { count: 0 };
          message.status = data.status;
          return { count: 1 };
        },
      ),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn(async () => refs[0] ?? null),
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: Array<{ messageId: string; externalMessageId: string; externalAccountId: string }>;
        }) => {
          const row = data[0];
          if (!row) return { count: 0 };
          if (refs.some((ref) => ref.externalMessageId === row.externalMessageId))
            return { count: 0 };
          refs.push(row);
          return { count: 1 };
        },
      ),
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { provider_externalAccountId_externalMessageId: { externalMessageId: string } };
        }) => {
          if (input.ownedMessageId === null) return null;
          if (input.ownedMessageId) return { messageId: input.ownedMessageId };
          const row = refs.find(
            (ref) =>
              ref.externalMessageId ===
              where.provider_externalAccountId_externalMessageId.externalMessageId,
          );
          return row ? { messageId: row.messageId } : null;
        },
      ),
    },
    auditLog: {
      create: vi.fn(async (row: unknown) => {
        if (input.auditThrow) throw new Error('audit_failed');
        audits.push(row);
        return { id: `a${audits.length}` };
      }),
    },
  };
  const prisma = {
    ...tx,
    $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => {
      const snap = {
        live: { ...live },
        message: { ...message },
        refs: [...refs],
        audits: [...audits],
      };
      try {
        return await fn(tx);
      } catch (error) {
        rolledBack = true;
        Object.assign(live, snap.live);
        Object.assign(message, snap.message);
        refs.splice(0, refs.length, ...snap.refs);
        audits.splice(0, audits.length, ...snap.audits);
        throw error;
      }
    }),
  };
  return { prisma, live, message, refs, audits, rolledBack: () => rolledBack };
}

describe('P4B-23 exact locked command identity', () => {
  it('requires canonical key, SEND_MESSAGE, resultMessageId, and conversationId', () => {
    const live = command();
    expect(lockedCommandMatchesResolvedMessage(live, JOB)).toBe(true);
    expect(
      lockedCommandMatchesResolvedMessage({ ...live, resultMessageId: 'msg-other' }, JOB),
    ).toBe(false);
    expect(
      lockedCommandMatchesResolvedMessage({ ...live, conversationId: 'conv-other' }, JOB),
    ).toBe(false);
    expect(lockedCommandMatchesResolvedMessage({ ...live, kind: 'OTHER' }, JOB)).toBe(false);
    expect(
      lockedCommandMatchesResolvedMessage(live, { ...JOB, idempotencyKey: 'core-wa-send:forged' }),
    ).toBe(false);
  });

  it.each([
    ['resultMessageId', { resultMessageId: 'msg-other' }],
    ['conversationId', { conversationId: 'conv-other' }],
  ] as const)('Gateway result does not mutate a colliding %s command', async (_label, forged) => {
    const { prisma, live, message, refs } = proofPrisma({ command: { ...forged } });
    await completeCoreSend(prisma as never, live as never, JOB, 'wamid-1', false, undefined, 'tok');
    expect(live.status).toBe('PENDING');
    expect(message.status).toBe('SENDING');
    expect(refs).toHaveLength(0);
    expect(prisma.messengerCommand.update).not.toHaveBeenCalled();
  });

  it.each([
    ['resultMessageId', { resultMessageId: 'msg-other' }],
    ['conversationId', { conversationId: 'conv-other' }],
  ] as const)('ref repair does not mutate a colliding %s command', async (_label, forged) => {
    const { prisma, live, message } = proofPrisma({
      command: { ...forged },
      messageStatus: 'FAILED',
      refs: [{ messageId: 'msg-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }],
    });
    const won = await repairWhatsAppRefProof(prisma as never, live as never, JOB);
    expect(won).toBe(false);
    expect(live.status).toBe('PENDING');
    expect(message.status).toBe('FAILED');
    expect(prisma.messengerCommand.update).not.toHaveBeenCalled();
  });

  it.each([
    ['resultMessageId', { resultMessageId: 'msg-other' }],
    ['conversationId', { conversationId: 'conv-other' }],
  ] as const)('ACK advances Message but skips a colliding %s command', async (_label, forged) => {
    const { prisma, live, message } = proofPrisma({
      command: { ...forged },
      messageStatus: 'SENDING',
      refs: [{ messageId: 'msg-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }],
    });
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: 'acc_a',
      providerMessageId: 'wamid-1',
      ack: 2,
    });
    expect(result.skipped).toBe(false);
    expect(message.status).toBe('DELIVERED');
    expect(live.status).toBe('PENDING');
    expect(prisma.messengerCommand.update).not.toHaveBeenCalled();
  });
});

describe('P4B-24 owned provider proof repairs FAILED', () => {
  it('repairs existing ref + FAILED Message + FAILED command', async () => {
    const { prisma, live, message, audits } = proofPrisma({
      command: { status: 'FAILED' },
      messageStatus: 'FAILED',
      refs: [{ messageId: 'msg-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }],
    });
    await completeCoreSend(prisma as never, live as never, JOB, 'wamid-1', false, undefined, 'tok');
    expect(message.status).toBe('SENT');
    expect(live.status).toBe('COMPLETED');
    expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED);
    expect(audits).toHaveLength(1);
  });

  it('publishes SENT when command is already COMPLETED without a duplicate audit', async () => {
    const published: string[] = [];
    const { prisma, live, message, audits } = proofPrisma({
      command: { status: 'COMPLETED' },
      messageStatus: 'FAILED',
      refs: [{ messageId: 'msg-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }],
    });
    await completeCoreSend(
      prisma as never,
      live as never,
      JOB,
      'wamid-1',
      false,
      {
        publish: async (event) => {
          published.push(event.status);
        },
      },
      'tok',
    );
    expect(message.status).toBe('SENT');
    expect(live.status).toBe('COMPLETED');
    expect(published).toEqual(['SENT']);
    expect(audits).toHaveLength(0);
    expect(prisma.messengerCommand.update).not.toHaveBeenCalled();
  });

  it('repairs a new owned ref on a FAILED pair', async () => {
    const { prisma, live, message, refs } = proofPrisma({
      command: { status: 'FAILED' },
      messageStatus: 'FAILED',
    });
    await completeCoreSend(
      prisma as never,
      live as never,
      JOB,
      'wamid-new',
      false,
      undefined,
      'tok',
    );
    expect(message.status).toBe('SENT');
    expect(live.status).toBe('COMPLETED');
    expect(refs).toHaveLength(1);
  });

  it('ACK from an owned ref repairs FAILED Message', async () => {
    const { prisma, live, message } = proofPrisma({
      command: { status: 'FAILED' },
      messageStatus: 'FAILED',
      refs: [{ messageId: 'msg-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' }],
    });
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: 'acc_a',
      providerMessageId: 'wamid-1',
      ack: 1,
    });
    expect(result.skipped).toBe(false);
    expect(message.status).toBe('SENT');
    expect(live.status).toBe('COMPLETED');
  });

  it('keeps CANCELLED Message while completing the matching command', async () => {
    const { prisma, live, message, refs } = proofPrisma({
      messageStatus: 'CANCELLED',
    });
    await completeCoreSend(prisma as never, live as never, JOB, 'wamid-1', false, undefined, 'tok');
    expect(message.status).toBe('CANCELLED');
    expect(live.status).toBe('COMPLETED');
    expect(refs).toHaveLength(1);
  });

  it('rolls back FAILED repair when the completion audit fails', async () => {
    const { prisma, live, message, refs, rolledBack } = proofPrisma({
      command: { status: 'FAILED' },
      messageStatus: 'FAILED',
      auditThrow: true,
    });
    await expect(
      completeCoreSend(prisma as never, live as never, JOB, 'wamid-new', false, undefined, 'tok'),
    ).rejects.toThrow('audit_failed');
    expect(rolledBack()).toBe(true);
    expect(message.status).toBe('FAILED');
    expect(live.status).toBe('FAILED');
    expect(refs).toHaveLength(0);
  });

  it('keeps a foreign-owned provider id as UNKNOWN under the live worker token', async () => {
    const { prisma, live, message } = proofPrisma({
      messageStatus: 'SENDING',
      ownedMessageId: 'msg-other',
    });
    await completeCoreSend(
      prisma as never,
      live as never,
      JOB,
      'wamid-stolen',
      false,
      undefined,
      'tok',
    );
    expect(live.status).toBe('OUTCOME_UNKNOWN');
    expect(live.invalidReason).toBe('PROVIDER_REF_CONFLICT');
    expect(message.status).toBe('OUTCOME_UNKNOWN');
  });
});
