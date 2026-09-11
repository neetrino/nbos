import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { canonicalCommandMatchesJob } from './messenger-outbound-command-canonical';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';
import { reconcileMessengerOutboundCommands } from './messenger-outbound-reconcile.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import {
  MESSENGER_AUDIT_EXTERNAL_SEND_INVALID,
  MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT,
} from './messenger-outbound-audit';

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
    firstAttemptAt: null as Date | null,
    createdAt: new Date(),
    invalidReason: null as string | null,
    nextReconcileAt: null as Date | null,
    dispatchToken: null as string | null,
    dispatchClaimedAt: null as Date | null,
    completedAt: null as Date | null,
    ...overrides,
  };
}

function dispatchPrisma(
  input: {
    command?: Record<string, unknown>;
    messageStatus?: string;
    auditThrow?: boolean;
  } = {},
) {
  const live = command(input.command);
  const message = {
    id: 'msg-1',
    conversationId: 'conv-c',
    status: input.messageStatus ?? 'QUEUED',
  };
  const refs: unknown[] = [];
  const audits: unknown[] = [];
  let rolledBack = false;
  const tx = {
    $queryRaw: vi.fn(async () => [{ ...live }]),
    messengerCommand: {
      findUnique: vi.fn(async () => ({ ...live })),
      findMany: vi.fn(async () => (live.status === 'PENDING' ? [{ ...live }] : [])),
      updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(live, data);
        return { count: 1 };
      }),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(live, data);
        return live;
      }),
    },
    messengerMessage: {
      findUnique: vi.fn(async () => ({
        ...message,
        content: 'hi',
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      })),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { status?: string | { in: string[] } };
          data: { status: string };
        }) => {
          const allowed =
            typeof where.status === 'string' ? [where.status] : (where.status?.in ?? []);
          if (allowed.length && !allowed.includes(message.status)) return { count: 0 };
          message.status = data.status;
          return { count: 1 };
        },
      ),
    },
    messengerMessageExternalRef: {
      findFirst: vi.fn().mockResolvedValue(null),
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => {
        refs.push(...data);
        return { count: data.length };
      }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
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

const connection = {
  requireClientConfig: vi.fn().mockResolvedValue({ baseUrl: 'https://wa.test', apiToken: 't' }),
};

describe('P4B-25 canonical identity before Gateway HTTP', () => {
  it('rejects a matching malformed command+job key that is not core-wa-send:{messageId}', () => {
    const forged = `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}forged`;
    const row = command({ idempotencyKey: forged });
    expect(canonicalCommandMatchesJob(row as never, { ...JOB, idempotencyKey: forged })).toBe(
      false,
    );
    expect(canonicalCommandMatchesJob(command() as never, JOB)).toBe(true);
  });

  it('does not call Gateway for a malformed row with a matching malformed job', async () => {
    const forged = `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}forged`;
    const { prisma, live, refs, audits } = dispatchPrisma({ command: { idempotencyKey: forged } });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, {
      ...JOB,
      idempotencyKey: forged,
    });
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(live.status).toBe('PENDING');
    expect(refs).toHaveLength(0);
    expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_PAYLOAD_CONFLICT);
  });

  it('scheduler terminalizes a malformed key and never enqueues', async () => {
    const forged = `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}forged`;
    const { prisma, live, message, audits } = dispatchPrisma({
      command: { idempotencyKey: forged },
    });
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.enqueued).toBe(0);
    expect(counts.invalid).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(live.status).toBe('FAILED');
    expect(live.invalidReason).toBe(MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD);
    expect(live.completedAt).toBeInstanceOf(Date);
    expect(live.dispatchToken).toBeNull();
    expect(live.nextReconcileAt).toBeNull();
    expect(message.status).toBe('QUEUED');
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(audits).toHaveLength(1);
    const second = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(second.scanned).toBe(0);
  });

  it('records conflict and skips Gateway for a forged queue job', async () => {
    const { prisma, live, refs } = dispatchPrisma();
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, {
      ...JOB,
      idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}other`,
    });
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(live.status).toBe('PENDING');
    expect(refs).toHaveLength(0);
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});

describe('P4B-26 pre-claim terminal Message convergence', () => {
  it.each(['CANCELLED', 'FAILED'] as const)(
    'finalizes %s before claim with zero Gateway',
    async (status) => {
      const { prisma, live, message, refs, audits } = dispatchPrisma({ messageStatus: status });
      const client = { sendAccountTextMessage: vi.fn() };
      await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
      expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
      expect(live.status).toBe('FAILED');
      expect(live.invalidReason).toBe(
        status === 'CANCELLED'
          ? MESSENGER_COMMAND_INVALID_REASON.MESSAGE_CANCELLED
          : MESSENGER_COMMAND_INVALID_REASON.MESSAGE_FAILED,
      );
      expect(live.dispatchToken).toBeNull();
      expect(message.status).toBe(status);
      expect(refs).toHaveLength(0);
      expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_INVALID);
    },
  );

  it('clears an expired stale claim while finalizing CANCELLED', async () => {
    const { prisma, live, message } = dispatchPrisma({
      messageStatus: 'CANCELLED',
      command: {
        dispatchToken: 'stale',
        nextReconcileAt: new Date(Date.now() - 1000),
        dispatchClaimedAt: new Date(Date.now() - 60_000),
      },
    });
    await dispatchWhatsAppCoreSendJob(
      prisma as never,
      connection as never,
      { sendAccountTextMessage: vi.fn() } as never,
      JOB,
    );
    expect(live.status).toBe('FAILED');
    expect(live.dispatchToken).toBeNull();
    expect(message.status).toBe('CANCELLED');
  });

  it('loses to an active other claim without mutation or HTTP', async () => {
    const { prisma, live, audits } = dispatchPrisma({
      messageStatus: 'CANCELLED',
      command: {
        dispatchToken: 'other',
        nextReconcileAt: new Date(Date.now() + 30_000),
      },
    });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(live.status).toBe('PENDING');
    expect(live.dispatchToken).toBe('other');
    expect(audits).toHaveLength(0);
  });

  it('duplicate invocation does not rewrite a already-finalized command', async () => {
    const { prisma, live, audits } = dispatchPrisma({ messageStatus: 'FAILED' });
    const client = { sendAccountTextMessage: vi.fn() };
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    await dispatchWhatsAppCoreSendJob(prisma as never, connection as never, client as never, JOB);
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
    expect(live.status).toBe('FAILED');
    expect(audits).toHaveLength(1);
  });

  it('rolls back pre-claim skip when audit fails', async () => {
    const { prisma, live, message, rolledBack } = dispatchPrisma({
      messageStatus: 'CANCELLED',
      auditThrow: true,
    });
    await expect(
      dispatchWhatsAppCoreSendJob(
        prisma as never,
        connection as never,
        { sendAccountTextMessage: vi.fn() } as never,
        JOB,
      ),
    ).rejects.toThrow('audit_failed');
    expect(rolledBack()).toBe(true);
    expect(live.status).toBe('PENDING');
    expect(message.status).toBe('CANCELLED');
  });
});
