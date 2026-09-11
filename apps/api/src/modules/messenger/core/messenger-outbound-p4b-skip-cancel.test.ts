import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { beginWhatsAppCoreSendAttempt } from './messenger-wa-outbound-attempt.ops';
import { reconcileMessengerOutboundCommands } from './messenger-outbound-reconcile.ops';
import { MESSENGER_COMMAND_INVALID_REASON } from './messenger-outbound-reconcile.constants';
import { MESSENGER_AUDIT_EXTERNAL_SEND_INVALID } from './messenger-outbound-audit';

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

function skipPrisma(messageStatus: 'CANCELLED' | 'FAILED', auditThrow = false) {
  const command = commandState();
  const message = { id: 'msg-1', conversationId: 'conv-c', status: 'QUEUED' };
  const audits: unknown[] = [];
  const prisma: Record<string, unknown> = {
    messengerCommand: {
      findUnique: async () => ({ ...command }),
      findMany: async () => (command.status === 'PENDING' ? [{ ...command }] : []),
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(command, data);
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
      updateMany: async ({
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
    },
    messengerMessageExternalRef: { findFirst: async () => null },
    messengerExternalConversationMapping: {
      findFirst: async () => ({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    auditLog: {
      create: async (input: unknown) => {
        if (auditThrow) throw new Error('audit_failed');
        audits.push(input);
        return { id: `a${audits.length}` };
      },
    },
    $queryRaw: async () => [{ ...command }],
    $transaction: async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      const snap = { command: { ...command }, message: { ...message }, audits: [...audits] };
      try {
        const result = await fn(prisma);
        if (command.dispatchToken && message.status === 'SENDING') {
          message.status = messageStatus;
        }
        return result;
      } catch (error) {
        Object.assign(command, snap.command);
        Object.assign(message, snap.message);
        audits.splice(0, audits.length, ...snap.audits);
        throw error;
      }
    },
  };
  return { prisma, command, message, audits };
}

describe('P4B-22 post-claim skip/cancellation', () => {
  it('terminals CANCELLED after claim with zero Gateway and clears the lease', async () => {
    const { prisma, command, message, audits } = skipPrisma('CANCELLED');
    const result = await beginWhatsAppCoreSendAttempt(
      prisma as never,
      command as never,
      JOB,
      'QUEUED',
    );
    expect(result.kind).toBe('stop');
    expect(command.status).toBe('FAILED');
    expect(command.invalidReason).toBe(MESSENGER_COMMAND_INVALID_REASON.MESSAGE_CANCELLED);
    expect(command.dispatchToken).toBeNull();
    expect(message.status).toBe('CANCELLED');
    expect(JSON.stringify(audits[0])).toContain(MESSENGER_AUDIT_EXTERNAL_SEND_INVALID);
  });

  it('terminals FAILED after claim without mutating Message', async () => {
    const { prisma, command, message } = skipPrisma('FAILED');
    const result = await beginWhatsAppCoreSendAttempt(
      prisma as never,
      command as never,
      JOB,
      'QUEUED',
    );
    expect(result.kind).toBe('stop');
    expect(command.status).toBe('FAILED');
    expect(command.invalidReason).toBe(MESSENGER_COMMAND_INVALID_REASON.MESSAGE_FAILED);
    expect(message.status).toBe('FAILED');
  });

  it('scheduler converges cancelled/failed instead of looping PENDING', async () => {
    const queued = skipPrisma('CANCELLED');
    queued.command.status = 'PENDING';
    queued.command.firstAttemptAt = new Date();
    queued.message.status = 'CANCELLED';
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const first = await reconcileMessengerOutboundCommands(queued.prisma as never, queue);
    expect(first.invalid).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(queued.command.status).toBe('FAILED');
    const second = await reconcileMessengerOutboundCommands(queued.prisma as never, queue);
    expect(second.scanned).toBe(0);
  });

  it('rolls back skip terminalization when audit fails', async () => {
    const { prisma, command, message } = skipPrisma('CANCELLED', true);
    await expect(
      beginWhatsAppCoreSendAttempt(prisma as never, command as never, JOB, 'QUEUED'),
    ).rejects.toThrow('audit_failed');
    expect(command.status).toBe('PENDING');
    expect(command.dispatchToken).toBeTruthy();
    expect(message.status).toBe('CANCELLED');
  });
});
