import { describe, expect, it, vi } from 'vitest';
import { applyWhatsAppAck } from './messenger-wa-lifecycle.ops';

const ACCOUNT = 'acc_a';
const PROVIDER_MESSAGE_ID = 'wamid-1';

function messageRow(status: string) {
  return {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'e1',
    senderNameSnapshot: 'Ada',
    content: 'hi',
    direction: 'OUTBOUND',
    status,
    provenance: 'EMPLOYEE',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date(),
    editedAt: null,
    attachments: [],
    mentions: [],
    referencesAsTarget: [],
  };
}

function createAckPrisma(initialStatus: string, commandStatus = 'PENDING') {
  const stored = { status: initialStatus };
  const prisma = {
    messengerMessageExternalRef: {
      findUnique: vi.fn().mockResolvedValue({ messageId: 'msg-1' }),
    },
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'cmd-1',
        idempotencyKey: 'core-wa-send:msg-1',
        kind: 'SEND_MESSAGE',
        status: commandStatus,
        resultMessageId: 'msg-1',
        conversationId: 'conv-1',
        payload: null,
        firstAttemptAt: null,
        createdAt: new Date(),
        invalidReason: null,
        nextReconcileAt: null,
        dispatchToken: null,
        dispatchClaimedAt: null,
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update: vi.fn().mockResolvedValue({}),
    },
    $queryRaw: vi.fn().mockResolvedValue([
      {
        id: 'cmd-1',
        idempotencyKey: 'core-wa-send:msg-1',
        kind: 'SEND_MESSAGE',
        status: commandStatus,
        resultMessageId: 'msg-1',
        conversationId: 'conv-1',
        payload: null,
        firstAttemptAt: null,
        createdAt: new Date(),
        invalidReason: null,
        nextReconcileAt: null,
        dispatchToken: null,
        dispatchClaimedAt: null,
      },
    ]),
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    messengerMessage: {
      findUnique: vi.fn(async () => messageRow(stored.status)),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { status: { in: string[] } };
          data: { status: string };
        }) => {
          await new Promise((resolve) => setTimeout(resolve, 15));
          const allowed = where.status.in;
          if (!allowed.includes(stored.status)) return { count: 0 };
          stored.status = data.status;
          return { count: 1 };
        },
      ),
    },
  };
  return { prisma, stored };
}

describe('applyWhatsAppAck (FINDING-S8-03)', () => {
  it('does not downgrade READ back to SENT sequentially', async () => {
    const { prisma, stored } = createAckPrisma('READ');
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 1,
    });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('ACK_NOT_ADVANCED');
    expect(stored.status).toBe('READ');
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });

  it('concurrent SENT and READ cannot leave SENT after READ is applied', async () => {
    const { prisma, stored } = createAckPrisma('SENDING');
    await Promise.all([
      applyWhatsAppAck(prisma as never, {
        accountId: ACCOUNT,
        providerMessageId: PROVIDER_MESSAGE_ID,
        ack: 1,
      }),
      applyWhatsAppAck(prisma as never, {
        accountId: ACCOUNT,
        providerMessageId: PROVIDER_MESSAGE_ID,
        ack: 3,
      }),
    ]);
    expect(stored.status).toBe('READ');
    expect(stored.status).not.toBe('SENT');
  });

  it('repairs OUTCOME_UNKNOWN to DELIVERED on a later ACK', async () => {
    const { prisma, stored } = createAckPrisma('OUTCOME_UNKNOWN');
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 2,
    });
    expect(result.skipped).toBe(false);
    expect(stored.status).toBe('DELIVERED');
  });

  it('repairs OUTCOME_UNKNOWN to READ on a later ACK', async () => {
    const { prisma, stored } = createAckPrisma('OUTCOME_UNKNOWN');
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 3,
    });
    expect(result.skipped).toBe(false);
    expect(stored.status).toBe('READ');
  });

  it('audits command COMPLETED on ACK even when message does not advance', async () => {
    const { prisma } = createAckPrisma('READ');
    await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 1,
    });
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'messenger.external_send_completed',
          actorType: 'AUTOMATION',
          actorId: 'messenger.whatsapp-gateway',
        }),
      }),
    );
  });

  it('advances Message after COMPLETED command without a second completion audit', async () => {
    const { prisma, stored } = createAckPrisma('SENT', 'COMPLETED');
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 2,
    });
    expect(result.skipped).toBe(false);
    expect(stored.status).toBe('DELIVERED');
    expect(prisma.messengerCommand.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('repairs FAILED Message from an owned-ref ACK and completes the matching command', async () => {
    const { prisma, stored } = createAckPrisma('FAILED');
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 2,
    });
    expect(result.skipped).toBe(false);
    expect(stored.status).toBe('DELIVERED');
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('keeps CANCELLED Message on ACK and still completes the matching command', async () => {
    const { prisma, stored } = createAckPrisma('CANCELLED');
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 3,
    });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('ACK_NOT_ADVANCED');
    expect(stored.status).toBe('CANCELLED');
    expect(prisma.messengerCommand.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
    );
  });

  it('returns MESSAGE_NOT_FOUND when the provider ref is missing (FINDING-S8-07)', async () => {
    const prisma = {
      messengerMessageExternalRef: { findUnique: vi.fn().mockResolvedValue(null) },
      messengerMessage: { findUnique: vi.fn(), updateMany: vi.fn() },
    };
    const result = await applyWhatsAppAck(prisma as never, {
      accountId: ACCOUNT,
      providerMessageId: PROVIDER_MESSAGE_ID,
      ack: 2,
    });
    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe('MESSAGE_NOT_FOUND');
    expect(prisma.messengerMessage.updateMany).not.toHaveBeenCalled();
  });
});
