import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { applyWhatsAppAck } from './messenger-wa-lifecycle.ops';
import { setCoreSendStatus } from './messenger-wa-outbound-complete.ops';
import {
  lockCanonicalWhatsAppCommandSql,
  MESSENGER_OUTBOUND_LOCK_ORDER,
} from './messenger-outbound-command-lock';

const JOB = {
  messageId: 'msg-1',
  conversationId: 'conv-c',
};

function command() {
  return {
    id: 'cmd-1',
    conversationId: JOB.conversationId,
    resultMessageId: JOB.messageId,
    idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
    kind: 'SEND_MESSAGE',
    status: 'PENDING',
    payload: { accountId: 'acc_a', chatId: '37499111222@c.us' },
    firstAttemptAt: new Date(),
    createdAt: new Date(),
    invalidReason: null,
    nextReconcileAt: new Date(Date.now() + 30_000),
    dispatchToken: 'tok',
    dispatchClaimedAt: new Date(),
  };
}

describe('P4B-19 command-first lock order', () => {
  it('documents command then ref/message then audit', () => {
    expect(MESSENGER_OUTBOUND_LOCK_ORDER[0]).toBe('messenger_commands');
    expect(
      JSON.stringify(
        lockCanonicalWhatsAppCommandSql({
          id: 'cmd-1',
          idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
        }),
      ),
    ).toMatch(/FOR UPDATE/);
  });

  it('ACK locks the command row before the Message CAS', async () => {
    const order: string[] = [];
    const live = command();
    const prisma = {
      $queryRaw: vi.fn(async () => {
        order.push('command-lock');
        return [{ ...live }];
      }),
      messengerMessageExternalRef: {
        findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
      },
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-c',
          status: 'SENDING',
          attachments: [],
          mentions: [],
          referencesAsTarget: [],
        }),
        updateMany: vi.fn(async () => {
          order.push('message');
          return { count: 1 };
        }),
      },
      messengerCommand: { update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
    await applyWhatsAppAck(prisma as never, {
      accountId: 'acc_a',
      providerMessageId: 'wamid-1',
      ack: 2,
    });
    expect(order.indexOf('command-lock')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('message')).toBeGreaterThan(order.indexOf('command-lock'));
  });

  it('worker outcome locks the command row before the Message CAS', async () => {
    const order: string[] = [];
    const live = command();
    const prisma = {
      $queryRaw: vi.fn(async () => {
        order.push('command-lock');
        return [{ ...live }];
      }),
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({ id: 'msg-1', status: 'SENDING' }),
        updateMany: vi.fn(async () => {
          order.push('message');
          return { count: 1 };
        }),
      },
      messengerCommand: {
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          Object.assign(live, data);
          return live;
        }),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
    await setCoreSendStatus(
      prisma as never,
      live as never,
      JOB,
      'FAILED',
      'WHATSAPP_NOT_CONNECTED',
      undefined,
      { kind: 'worker', token: 'tok' },
    );
    expect(order.indexOf('command-lock')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('message')).toBeGreaterThan(order.indexOf('command-lock'));
  });

  it('does not reset dispatchClaimedAt while authorizing a worker token', async () => {
    const claimedAt = new Date('2026-09-05T12:00:00.000Z');
    const live = { ...command(), dispatchClaimedAt: claimedAt };
    const prisma = {
      $queryRaw: vi.fn(async () => [{ ...live }]),
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({ id: 'msg-1', status: 'SENDING' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      messengerCommand: {
        updateMany: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    };
    await setCoreSendStatus(
      prisma as never,
      { ...live, dispatchClaimedAt: null } as never,
      JOB,
      'FAILED',
      'WHATSAPP_NOT_CONNECTED',
      undefined,
      { kind: 'worker', token: 'tok' },
    );
    expect(prisma.messengerCommand.updateMany).not.toHaveBeenCalled();
    expect(live.dispatchClaimedAt).toEqual(claimedAt);
  });
});
