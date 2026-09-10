import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { reconcileMessengerOutboundCommands } from './messenger-outbound-reconcile.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { MESSENGER_AUDIT_EXTERNAL_SEND_INVALID } from './messenger-outbound-audit';

const FORGED = `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}forged`;

function command(overrides?: Record<string, unknown>) {
  return {
    id: 'cmd-1',
    conversationId: 'conv-c',
    resultMessageId: 'msg-1',
    idempotencyKey: FORGED,
    kind: 'SEND_MESSAGE',
    status: 'PENDING',
    payload: { accountId: 'acc_a', chatId: '37499111222@c.us' },
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

function malformedPrisma(input: {
  command?: Record<string, unknown>;
  lockCommand?: Record<string, unknown>;
  auditThrow?: boolean;
} = {}) {
  const scanned = command(input.command);
  const live = { ...scanned, ...input.lockCommand };
  const message = { id: 'msg-1', conversationId: 'conv-c', status: 'QUEUED' };
  const audits: unknown[] = [];
  let rolledBack = false;
  const tx = {
    $queryRaw: vi.fn(async () => [{ ...live }]),
    messengerCommand: {
      findMany: vi.fn(async () => {
        const row = input.lockCommand ? scanned : live;
        if (row.status !== 'PENDING' && row.status !== 'OUTCOME_UNKNOWN') return [];
        return [{ ...row }];
      }),
      findUnique: vi.fn(async () => ({ ...live })),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(live, data);
        return live;
      }),
      updateMany: vi.fn(),
    },
    messengerMessage: {
      findUnique: vi.fn(async () => ({ ...message, deletedAt: null, conversation: { zone: 'CLIENT' } })),
      updateMany: vi.fn(async () => {
        throw new Error('message_must_not_mutate');
      }),
    },
    messengerMessageExternalRef: { findFirst: vi.fn().mockResolvedValue(null) },
    messengerExternalConversationMapping: { findFirst: vi.fn().mockResolvedValue(null) },
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
      const snap = { live: { ...live }, message: { ...message }, audits: [...audits] };
      try {
        return await fn(tx);
      } catch (error) {
        rolledBack = true;
        Object.assign(live, snap.live);
        Object.assign(message, snap.message);
        audits.splice(0, audits.length, ...snap.audits);
        throw error;
      }
    }),
  };
  return { prisma, live, scanned, message, audits, rolledBack: () => rolledBack };
}

describe('P4B-27 scheduler malformed command convergence', () => {
  it('writes FAILED + MALFORMED_PAYLOAD without touching Message and drops the next scan', async () => {
    const { prisma, live, message, audits } = malformedPrisma();
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const first = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(first.invalid).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(live.status).toBe('FAILED');
    expect(live.invalidReason).toBe(MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD);
    expect(live.completedAt).toBeInstanceOf(Date);
    expect(live.dispatchToken).toBeNull();
    expect(live.nextReconcileAt).toBeNull();
    expect(message.status).toBe('QUEUED');
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_INVALID);
    expect(JSON.stringify(audits[0])).not.toContain('"messageStatus":"FAILED"');
    const second = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(second.scanned).toBe(0);
    expect(second.invalid).toBe(0);
  });

  it('uses command id as audit evidence when resultMessageId is null', async () => {
    const { prisma, live, audits } = malformedPrisma({ command: { resultMessageId: null } });
    const counts = await reconcileMessengerOutboundCommands(prisma as never, {
      isAvailable: () => true,
      enqueue: vi.fn(),
    });
    expect(counts.invalid).toBe(1);
    expect(live.status).toBe('FAILED');
    expect(JSON.stringify(audits[0])).toContain('"entityId":"cmd-1"');
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });

  it('does not increment invalid when an active claim wins the lock', async () => {
    const { prisma, live, audits } = malformedPrisma({
      lockCommand: {
        dispatchToken: 'other',
        nextReconcileAt: new Date(Date.now() + 30_000),
      },
    });
    const counts = await reconcileMessengerOutboundCommands(prisma as never, {
      isAvailable: () => true,
      enqueue: vi.fn(),
    });
    expect(counts.invalid).toBe(0);
    expect(live.status).toBe('PENDING');
    expect(live.dispatchToken).toBe('other');
    expect(audits).toHaveLength(0);
    expect(prisma.messengerCommand.update).not.toHaveBeenCalled();
  });

  it('does not increment invalid when the live snapshot no longer matches', async () => {
    const { prisma, live, audits } = malformedPrisma({
      lockCommand: { firstAttemptAt: new Date('2026-01-01T00:00:00.000Z') },
    });
    const counts = await reconcileMessengerOutboundCommands(prisma as never, {
      isAvailable: () => true,
      enqueue: vi.fn(),
    });
    expect(counts.invalid).toBe(0);
    expect(live.status).toBe('PENDING');
    expect(audits).toHaveLength(0);
  });

  it('does not increment invalid when the locked row became canonically valid', async () => {
    const { prisma, live, audits } = malformedPrisma({
      lockCommand: {
        resultMessageId: 'forged',
        idempotencyKey: FORGED,
      },
    });
    const counts = await reconcileMessengerOutboundCommands(prisma as never, {
      isAvailable: () => true,
      enqueue: vi.fn(),
    });
    expect(counts.invalid).toBe(0);
    expect(live.status).toBe('PENDING');
    expect(audits).toHaveLength(0);
  });

  it('rolls back command-only invalidation when audit fails', async () => {
    const { prisma, live, rolledBack } = malformedPrisma({ auditThrow: true });
    const counts = await reconcileMessengerOutboundCommands(prisma as never, {
      isAvailable: () => true,
      enqueue: vi.fn(),
    });
    expect(counts.invalid).toBe(0);
    expect(counts.errors).toBe(1);
    expect(rolledBack()).toBe(true);
    expect(live.status).toBe('PENDING');
    expect(live.completedAt).toBeNull();
  });
});
