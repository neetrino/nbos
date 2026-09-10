import { describe, expect, it, vi } from 'vitest';
import { WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX } from '../../integrations/whatsapp-gateway/whatsapp-gateway.constants';
import { reconcileMessengerOutboundCommands } from './messenger-outbound-reconcile.ops';
import { dispatchWhatsAppCoreSendJob } from './messenger-wa-outbound-dispatch.ops';
import { beginWhatsAppCoreSendAttempt } from './messenger-wa-outbound-attempt.ops';
import {
  isNeverAttemptedQueuedSend,
  isWithinWhatsAppSameKeyWindow,
} from './messenger-outbound-gateway-window';

const CHAT = '37499111222@c.us';
const JOB = {
  kind: 'core_client_send' as const,
  chatId: CHAT,
  accountId: 'acc_a',
  messageId: 'msg-1',
  conversationId: 'conv-c',
  idempotencyKey: `${WHATSAPP_CORE_SEND_IDEMPOTENCY_PREFIX}msg-1`,
};

const HOUR = 60 * 60 * 1000;

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

function attemptPrisma(live: ReturnType<typeof command>, status: string) {
  return {
    $queryRaw: vi.fn(async () => [{ ...live }]),
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(live),
      count: vi.fn().mockResolvedValue(1),
      updateMany: vi.fn().mockImplementation(async ({ data }: { data?: Record<string, unknown> }) => {
        if (data) Object.assign(live, data);
        return { count: 1 };
      }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(live, data);
        return live;
      }),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-c',
        content: 'hi',
        status,
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    messengerMessageExternalRef: { findFirst: vi.fn().mockResolvedValue(null) },
  };
}

function pendingRow(overrides?: Record<string, unknown>) {
  return command(overrides);
}

function reconcilePrisma(row: ReturnType<typeof pendingRow>, status = 'QUEUED') {
  return {
    $queryRaw: vi.fn(async () => [{ ...row }]),
    messengerCommand: {
      findMany: vi.fn().mockResolvedValue([row]),
      updateMany: vi.fn().mockImplementation(async ({ data }: { data?: Record<string, unknown> }) => {
        if (data) Object.assign(row, data);
        return { count: 1 };
      }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(row, data);
        return row;
      }),
      findUnique: vi.fn().mockResolvedValue(row),
      count: vi.fn().mockResolvedValue(1),
    },
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-c',
        content: 'hi',
        status,
        deletedAt: null,
        conversation: { zone: 'CLIENT' },
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    messengerExternalConversationMapping: {
      findFirst: vi.fn().mockResolvedValue({
        externalAccountId: 'acc_a',
        externalConversationId: CHAT,
        conversation: { zone: 'CLIENT' },
      }),
    },
    messengerMessageExternalRef: { findFirst: vi.fn().mockResolvedValue(null) },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
  };
}

describe('P4B-02 Gateway window start', () => {
  it('treats 48h-old never-attempted QUEUED as still enqueueable', async () => {
    expect(
      isNeverAttemptedQueuedSend(null, 'QUEUED'),
    ).toBe(true);
    const createdAt = new Date(Date.now() - 48 * HOUR);
    const prisma = reconcilePrisma(pendingRow({ createdAt, firstAttemptAt: null }));
    const queue = {
      isAvailable: vi.fn().mockReturnValue(true),
      enqueue: vi.fn().mockResolvedValue(undefined),
    };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.enqueued).toBe(1);
    expect(counts.manualReview).toBe(0);
  });

  it('starts a fresh 24h window at firstAttemptAt, not createdAt', () => {
    const createdAt = new Date(Date.now() - 48 * HOUR);
    const firstAttemptAt = new Date();
    expect(isWithinWhatsAppSameKeyWindow({ firstAttemptAt, createdAt }, new Date())).toBe(true);
    expect(
      isWithinWhatsAppSameKeyWindow(
        { firstAttemptAt: new Date(Date.now() - 24 * HOUR - 1000), createdAt },
        new Date(),
      ),
    ).toBe(false);
  });

  it('sends 24h-after-first-attempt UNKNOWN to manual review', async () => {
    const firstAttemptAt = new Date(Date.now() - 24 * HOUR - 60_000);
    const prisma = reconcilePrisma(
      pendingRow({
        status: 'OUTCOME_UNKNOWN',
        firstAttemptAt,
        createdAt: new Date(Date.now() - 72 * HOUR),
      }),
      'OUTCOME_UNKNOWN',
    );
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.manualReview).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invalidReason: 'GATEWAY_WINDOW_EXPIRED',
          nextReconcileAt: null,
          completedAt: null,
        }),
      }),
    );
  });

  it('does not call Gateway when the attempt CAS transaction fails', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue(command()),
        count: vi.fn().mockResolvedValue(1),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      messengerMessage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'msg-1',
          conversationId: 'conv-c',
          content: 'hi',
          status: 'QUEUED',
          deletedAt: null,
          conversation: { zone: 'CLIENT' },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      messengerExternalConversationMapping: {
        findFirst: vi.fn().mockResolvedValue({
          externalAccountId: 'acc_a',
          externalConversationId: CHAT,
          conversation: { zone: 'CLIENT' },
        }),
      },
      messengerMessageExternalRef: { findFirst: vi.fn().mockResolvedValue(null) },
      auditLog: { create: vi.fn() },
    };
    const client = { sendAccountTextMessage: vi.fn() };
    const connection = { requireClientConfig: vi.fn() };
    await dispatchWhatsAppCoreSendJob(
      prisma as never,
      connection as never,
      client as never,
      JOB,
    );
    expect(client.sendAccountTextMessage).not.toHaveBeenCalled();
  });

  it('never moves firstAttemptAt after it is set', async () => {
    const first = new Date(Date.now() - 60 * 60 * 1000);
    const live = command({ firstAttemptAt: first, status: 'PENDING' });
    const prisma = attemptPrisma(live, 'SENDING');
    const result = await beginWhatsAppCoreSendAttempt(
      prisma as never,
      live as never,
      JOB,
      'SENDING',
    );
    expect(result.kind).toBe('proceed');
    expect(prisma.messengerCommand.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ firstAttemptAt: expect.any(Date) }),
      }),
    );
  });

  it('infers createdAt for 23h legacy SENT and expires 25h SENT before Gateway', async () => {
    const created23 = new Date(Date.now() - 23 * HOUR);
    const created25 = new Date(Date.now() - 25 * HOUR);
    expect(
      isWithinWhatsAppSameKeyWindow({ firstAttemptAt: null, createdAt: created23 }, new Date()),
    ).toBe(true);
    expect(
      isWithinWhatsAppSameKeyWindow({ firstAttemptAt: null, createdAt: created25 }, new Date()),
    ).toBe(false);
    const prisma = reconcilePrisma(
      pendingRow({ createdAt: created25, firstAttemptAt: null, status: 'PENDING' }),
      'SENT',
    );
    const queue = { isAvailable: vi.fn().mockReturnValue(true), enqueue: vi.fn() };
    const counts = await reconcileMessengerOutboundCommands(prisma as never, queue);
    expect(counts.manualReview).toBe(1);
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it.each(['SENT', 'OUTCOME_UNKNOWN', 'SENDING'] as const)(
    'infers createdAt for 23h legacy %s and never stamps now',
    async (status) => {
      const createdAt = new Date(Date.now() - 23 * HOUR);
      const live = command({ createdAt, firstAttemptAt: createdAt, status: 'PENDING' });
      const prisma = attemptPrisma(live, status);
      const result = await beginWhatsAppCoreSendAttempt(
        prisma as never,
        command({ createdAt, firstAttemptAt: null }) as never,
        JOB,
        status,
      );
      expect(result.kind).toBe('proceed');
      const stamps = prisma.messengerCommand.updateMany.mock.calls.filter(
        (call) => call[0] && typeof call[0] === 'object' && 'data' in call[0],
      ) as Array<[{ data?: { firstAttemptAt?: Date } }]>;
      const firstAttemptWrites = stamps.filter((call) => call[0]?.data?.firstAttemptAt);
      expect(firstAttemptWrites).toHaveLength(1);
      expect(firstAttemptWrites[0]?.[0]?.data?.firstAttemptAt).toBe(createdAt);
    },
  );

  it.each(['SENT', 'OUTCOME_UNKNOWN', 'SENDING'] as const)(
    'expires 25h legacy %s before Gateway and never stamps now',
    async (status) => {
      const createdAt = new Date(Date.now() - 25 * HOUR);
      const live = command({ createdAt, firstAttemptAt: createdAt, status: 'PENDING' });
      const prisma = attemptPrisma(live, status);
      const result = await beginWhatsAppCoreSendAttempt(
        prisma as never,
        command({ createdAt, firstAttemptAt: null }) as never,
        JOB,
        status,
      );
      expect(result.kind).toBe('stop');
      const stamps = prisma.messengerCommand.updateMany.mock.calls.filter(
        (call) => call[0] && typeof call[0] === 'object' && 'data' in call[0],
      ) as Array<[{ data?: { firstAttemptAt?: Date } }]>;
      for (const call of stamps) {
        if (call[0]?.data?.firstAttemptAt) {
          expect(call[0].data.firstAttemptAt).toBe(createdAt);
        }
      }
    },
  );
});
