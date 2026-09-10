import { describe, expect, it } from 'vitest';
import {
  WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX,
  WHATSAPP_CORE_UNKNOWN_RECONCILE_MS,
  WHATSAPP_GATEWAY_REQUEST_TIMEOUT_MS,
} from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { MESSENGER_DISPATCH_CLAIM_LEASE_MS } from './messenger-outbound-command-claim';
import { markWhatsAppCommandInvalid } from './messenger-outbound-command-invalid.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { beginWhatsAppCoreSendAttempt } from './messenger-wa-outbound-attempt.ops';
import { completeCoreSend, setCoreSendStatus } from './messenger-wa-outbound-complete.ops';
import { MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED } from './messenger-outbound-audit';

const CHAT = '37499111222@c.us';
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

function commandState(overrides?: Record<string, unknown>) {
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
    ...overrides,
  };
}

function matchesWhere(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [key, expected] of Object.entries(where)) {
    if (key === 'OR') {
      const options = expected as Record<string, unknown>[];
      if (!options.some((option) => matchesWhere(row, option))) return false;
      continue;
    }
    if (key === 'NOT') continue;
    if (expected && typeof expected === 'object' && 'in' in expected) {
      if (!(expected.in as unknown[]).includes(row[key])) return false;
      continue;
    }
    if (expected && typeof expected === 'object' && 'lte' in expected) {
      const value = row[key] as Date | null;
      if (!value || value.getTime() > (expected.lte as Date).getTime()) return false;
      continue;
    }
    if (expected && typeof expected === 'object' && 'gt' in expected) {
      const value = row[key] as Date | null;
      if (!value || value.getTime() <= (expected.gt as Date).getTime()) return false;
      continue;
    }
    if (row[key] !== expected) return false;
  }
  return true;
}

function livePrisma(cmd = commandState(), messageStatus = 'QUEUED', injectRefOnClaim = false) {
  const command = { ...cmd };
  const message = { id: 'msg-1', conversationId: 'conv-c', status: messageStatus };
  const refs: Array<{ messageId: string; externalMessageId: string; externalAccountId: string }> = [];
  const audits: unknown[] = [];
  const prisma: Record<string, unknown> = {
    messengerCommand: {
      findUnique: async () => ({ ...command }),
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(command, where)) return { count: 0 };
        Object.assign(command, data);
        if (injectRefOnClaim && typeof data.dispatchToken === 'string') {
          refs.push({ messageId: 'msg-1', externalMessageId: 'wamid-1', externalAccountId: 'acc_a' });
        }
        return { count: 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(command, data);
        return command;
      },
    },
    messengerMessage: {
      findUnique: async () => ({
        ...message,
        content: 'hi',
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      }),
      updateMany: async ({ where, data }: { where: { id?: string; status?: string | { in: string[] } }; data: { status: string } }) => {
        if (where.id && where.id !== message.id) return { count: 0 };
        const allowed = typeof where.status === 'string' ? [where.status] : (where.status?.in ?? []);
        if (allowed.length && !allowed.includes(message.status)) return { count: 0 };
        message.status = data.status;
        return { count: 1 };
      },
    },
    messengerMessageExternalRef: {
      findFirst: async () => refs[0] ?? null,
      createMany: async ({ data }: { data: Array<{ messageId: string; externalMessageId: string; externalAccountId: string }> }) => {
        const row = data[0];
        if (!row) return { count: 0 };
        if (refs.some((ref) => ref.externalMessageId === row.externalMessageId)) return { count: 0 };
        refs.push(row);
        return { count: 1 };
      },
      findUnique: async ({
        where,
      }: {
        where: { provider_externalAccountId_externalMessageId: { externalMessageId: string } };
      }) => {
        const row = refs.find(
          (ref) =>
            ref.externalMessageId === where.provider_externalAccountId_externalMessageId.externalMessageId,
        );
        return row ? { messageId: row.messageId } : null;
      },
    },
    messengerExternalConversationMapping: {
      findFirst: async () => ({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    auditLog: {
      create: async (input: unknown) => {
        audits.push(input);
        return { id: `a${audits.length}` };
      },
    },
    $queryRaw: async () => [{ ...command }],
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const snap = {
        command: { ...command },
        message: { ...message },
        refs: [...refs],
        audits: [...audits],
      };
      try {
        return await fn(prisma);
      } catch (error) {
        Object.assign(command, snap.command);
        Object.assign(message, snap.message);
        refs.splice(0, refs.length, ...snap.refs);
        audits.splice(0, audits.length, ...snap.audits);
        throw error;
      }
    },
  };
  return { prisma, command, message, refs, audits };
}

describe('P4B-14 dispatch lease', () => {
  it('keeps Gateway HTTP timeout strictly below the 60s claim lease', () => {
    expect(WHATSAPP_GATEWAY_REQUEST_TIMEOUT_MS).toBeLessThan(MESSENGER_DISPATCH_CLAIM_LEASE_MS);
    expect(MESSENGER_DISPATCH_CLAIM_LEASE_MS).toBe(WHATSAPP_CORE_UNKNOWN_RECONCILE_MS);
  });

  it('does not let scheduler invalid terminalize an active worker claim', async () => {
    const { prisma, command, message } = livePrisma();
    const claimed = await beginWhatsAppCoreSendAttempt(
      prisma as never,
      command as never,
      JOB,
      'QUEUED',
    );
    expect(claimed.kind).toBe('proceed');
    await markWhatsAppCommandInvalid(
      prisma as never,
      { ...command } as never,
      JOB,
      MESSENGER_COMMAND_INVALID_REASON.MALFORMED_PAYLOAD,
    );
    expect(command.status).toBe('PENDING');
    expect(message.status).toBe('SENDING');
    expect(command.dispatchToken).toBeTruthy();
  });

  it('lets only one of two recovery workers take the token', async () => {
    const first = commandState({ firstAttemptAt: new Date(), status: 'PENDING' });
    const { prisma, command } = livePrisma(first, 'SENDING');
    const [a, b] = await Promise.all([
      beginWhatsAppCoreSendAttempt(prisma as never, { ...command } as never, JOB, 'SENDING'),
      beginWhatsAppCoreSendAttempt(prisma as never, { ...command } as never, JOB, 'SENDING'),
    ]);
    const winners = [a, b].filter((result) => result.kind === 'proceed');
    expect(winners).toHaveLength(1);
    expect(command.dispatchToken).toBeTruthy();
  });

  it('rejects an old token after lease replacement', async () => {
    const { prisma, command, message } = livePrisma(
      commandState({ firstAttemptAt: new Date() }),
      'SENDING',
    );
    const first = await beginWhatsAppCoreSendAttempt(prisma as never, command as never, JOB, 'SENDING');
    expect(first.kind).toBe('proceed');
    command.nextReconcileAt = new Date(Date.now() - 1000);
    const second = await beginWhatsAppCoreSendAttempt(prisma as never, command as never, JOB, 'SENDING');
    expect(second.kind).toBe('proceed');
    if (first.kind !== 'proceed' || second.kind !== 'proceed') return;
    await setCoreSendStatus(
      prisma as never,
      command as never,
      JOB,
      'FAILED',
      'WHATSAPP_NOT_CONNECTED',
      undefined,
      { kind: 'worker', token: first.token },
    );
    expect(command.status).toBe('PENDING');
    expect(message.status).toBe('SENDING');
    expect(command.dispatchToken).toBe(second.token);
  });

  it('stops before HTTP when provider proof appears immediately after claim', async () => {
    const { prisma, command, message } = livePrisma(commandState(), 'QUEUED', true);
    const claimed = await beginWhatsAppCoreSendAttempt(
      prisma as never,
      command as never,
      JOB,
      'QUEUED',
    );
    expect(claimed.kind).toBe('stop');
    expect(message.status).toBe('SENT');
    expect(command.status).toBe('COMPLETED');
  });
});

describe('P4B-16/17 proof audit and FAILED/CANCELLED', () => {
  it('completes PENDING with the same ref after a crash (idempotent)', async () => {
    const { prisma, command, audits } = livePrisma(
      commandState({ firstAttemptAt: new Date(), dispatchToken: 'tok', nextReconcileAt: new Date(Date.now() + 30_000) }),
      'SENDING',
    );
    await completeCoreSend(prisma as never, command as never, JOB, 'wamid-1', false, undefined, 'tok');
    const firstAudits = audits.length;
    await completeCoreSend(prisma as never, command as never, JOB, 'wamid-1', false, undefined, 'tok');
    expect(command.status).toBe('COMPLETED');
    expect(firstAudits).toBe(1);
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED);
  });

  it('completes a FAILED command when the same-message Message is already SENT', async () => {
    const { prisma, command, audits } = livePrisma(
      commandState({ status: 'FAILED', firstAttemptAt: new Date() }),
      'SENT',
    );
    await completeCoreSend(prisma as never, command as never, JOB, 'wamid-1', false, undefined, 'tok');
    expect(command.status).toBe('COMPLETED');
    expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_COMPLETED);
  });

  it('keeps CANCELLED Message, owned ref, and completes the command', async () => {
    const { prisma, command, message, refs } = livePrisma(
      commandState({ firstAttemptAt: new Date(), dispatchToken: 'tok', nextReconcileAt: new Date(Date.now() + 30_000) }),
      'CANCELLED',
    );
    await completeCoreSend(prisma as never, command as never, JOB, 'wamid-1', false, undefined, 'tok');
    expect(message.status).toBe('CANCELLED');
    expect(command.status).toBe('COMPLETED');
    expect(refs).toHaveLength(1);
  });

  it('repairs a new owned ref when command and Message are FAILED', async () => {
    const { prisma, command, refs, message } = livePrisma(
      commandState({ status: 'FAILED', firstAttemptAt: new Date() }),
      'FAILED',
    );
    await completeCoreSend(prisma as never, command as never, JOB, 'wamid-new', false, undefined, 'tok');
    expect(command.status).toBe('COMPLETED');
    expect(message.status).toBe('SENT');
    expect(refs).toHaveLength(1);
  });
});
