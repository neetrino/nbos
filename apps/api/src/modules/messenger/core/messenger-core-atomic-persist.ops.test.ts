import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { persistCoreMessage } from './messenger-core-message.ops';
import { persistWhatsAppSendCommandInTx } from './messenger-wa-outbound.ops';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: vi.fn(async () => 1n),
}));

const CHAT = '37499111222@c.us';
const MAPPING = { externalAccountId: 'acc_a', externalConversationId: CHAT };
const INTENT = { mapping: MAPPING, actorEmployeeId: 'e1' };

function queuedMessage(id = 'msg-1') {
  return {
    id,
    conversationId: 'conv-c',
    senderId: 'e1',
    senderNameSnapshot: 'Ada Lovelace',
    content: 'hello',
    direction: 'OUTBOUND',
    status: 'QUEUED',
    provenance: 'EMPLOYEE',
    replyToMessageId: null,
    threadRootMessageId: null,
    createdAt: new Date(),
    editedAt: null,
    deletedAt: null,
    attachments: [],
  };
}

function persistPrisma(options?: { commandThrows?: boolean; existingMessage?: object | null }) {
  let rolledBack = false;
  let commandReads = 0;
  const tx = {
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue(options?.existingMessage ?? null),
      create: vi.fn().mockResolvedValue(queuedMessage()),
    },
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue({ id: 'conv-c', zone: 'CLIENT' }),
      update: vi.fn(),
    },
    employee: {
      findUnique: vi.fn().mockResolvedValue({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@nbos.test',
      }),
    },
    messengerCommand: {
      findUnique: vi.fn().mockImplementation(() => {
        commandReads += 1;
        const existingId =
          options?.existingMessage && 'id' in options.existingMessage
            ? String(options.existingMessage.id)
            : 'msg-1';
        const existenceReads = options?.existingMessage ? 2 : 1;
        if (commandReads <= existenceReads) return Promise.resolve(null);
        return Promise.resolve({
          id: 'cmd-1',
          status: 'PENDING',
          conversationId: 'conv-c',
          resultMessageId: existingId,
          kind: 'SEND_MESSAGE',
          payload: { accountId: 'acc_a', chatId: CHAT },
        });
      }),
      createMany: options?.commandThrows
        ? vi.fn().mockRejectedValue(new Error('command_write_failed'))
        : vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  const prisma = {
    $executeRaw: vi.fn().mockResolvedValue(1),
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

describe('atomic WhatsApp Core persist', () => {
  it('rolls back message, lastMessageAt, and revision when command create fails', async () => {
    const { prisma, tx, rolledBack } = persistPrisma({ commandThrows: true });
    await expect(
      persistCoreMessage(
        prisma as never,
        {
          conversationId: 'conv-c',
          senderId: 'e1',
          content: 'hello',
          status: 'QUEUED',
          direction: 'OUTBOUND',
        },
        [],
        INTENT,
      ),
    ).rejects.toThrow('command_write_failed');
    expect(tx.messengerMessage.create).toHaveBeenCalled();
    expect(tx.messengerConversation.update).toHaveBeenCalled();
    expect(rolledBack()).toBe(true);
  });

  it('creates one command keyed by the committed message id', async () => {
    const { prisma, tx } = persistPrisma();
    const created = await persistCoreMessage(
      prisma as never,
      {
        conversationId: 'conv-c',
        senderId: 'e1',
        content: 'hello',
        status: 'QUEUED',
        direction: 'OUTBOUND',
        idempotencyKey: 'http-k1',
      },
      [],
      INTENT,
    );
    expect(created.id).toBe('msg-1');
    expect(tx.messengerCommand.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            idempotencyKey: whatsAppOutboundIdempotencyKey('msg-1'),
            kind: 'SEND_MESSAGE',
            status: 'PENDING',
            payload: { accountId: 'acc_a', chatId: CHAT },
          }),
        ],
        skipDuplicates: true,
      }),
    );
  });

  it('returns the existing QUEUED message and creates a missing command (rolling repair)', async () => {
    const existing = queuedMessage('msg-dup');
    const { prisma, tx } = persistPrisma({ existingMessage: existing });
    const result = await persistCoreMessage(
      prisma as never,
      {
        conversationId: 'conv-c',
        senderId: 'e1',
        content: 'hello',
        idempotencyKey: 'http-k1',
        status: 'QUEUED',
        direction: 'OUTBOUND',
      },
      [],
      INTENT,
    );
    expect(result.id).toBe('msg-dup');
    expect(tx.messengerMessage.create).not.toHaveBeenCalled();
    expect(tx.messengerCommand.createMany).toHaveBeenCalledTimes(1);
  });

  it('does not create a command for Internal persist', async () => {
    const { prisma, tx } = persistPrisma();
    tx.messengerConversation.findUnique.mockResolvedValue({ id: 'conv-i', zone: 'INTERNAL' });
    tx.messengerMessage.create.mockResolvedValue({
      ...queuedMessage(),
      conversationId: 'conv-i',
      direction: 'INTERNAL',
      status: 'SENT',
    });
    await persistCoreMessage(
      prisma as never,
      { conversationId: 'conv-i', senderId: 'e1', content: 'hello' },
      [],
      INTENT,
    );
    expect(tx.messengerCommand.createMany).not.toHaveBeenCalled();
  });

  it('takes the advisory lock before the first idempotency read', async () => {
    const { prisma, tx } = persistPrisma();
    await persistCoreMessage(
      prisma as never,
      {
        conversationId: 'conv-c',
        senderId: 'e1',
        content: 'hello',
        status: 'QUEUED',
        direction: 'OUTBOUND',
        idempotencyKey: 'http-k1',
      },
      [],
      INTENT,
    );
    const lockOrder = tx.$executeRaw.mock.invocationCallOrder[0];
    const readOrder = tx.messengerMessage.findUnique.mock.invocationCallOrder[0];
    expect(lockOrder).toBeLessThan(readOrder);
    expect(String(tx.$executeRaw.mock.calls[0]?.[0]?.[0] ?? tx.$executeRaw.mock.calls[0])).toMatch(
      /pg_advisory_xact_lock/,
    );
  });

  it('does not catch-and-continue after a unique failure inside the transaction', async () => {
    const { prisma, tx, rolledBack } = persistPrisma();
    tx.messengerMessage.create.mockRejectedValue({ code: 'P2002', message: 'unique' });
    await expect(
      persistCoreMessage(
        prisma as never,
        {
          conversationId: 'conv-c',
          senderId: 'e1',
          content: 'hello',
          status: 'QUEUED',
          direction: 'OUTBOUND',
          idempotencyKey: 'http-k1',
        },
        [],
        INTENT,
      ),
    ).rejects.toMatchObject({ code: 'P2002' });
    expect(rolledBack()).toBe(true);
    expect(tx.messengerMessage.findUnique).toHaveBeenCalledTimes(1);
  });

  it('rejects a colliding command row instead of silently accepting it', async () => {
    const prisma = {
      messengerCommand: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cmd-other',
          status: 'PENDING',
          conversationId: 'conv-other',
          resultMessageId: 'msg-other',
          kind: 'SEND_MESSAGE',
          payload: { accountId: 'acc_a', chatId: CHAT },
        }),
      },
    };
    await expect(
      persistWhatsAppSendCommandInTx(prisma as never, {
        conversationId: 'conv-c',
        messageId: 'msg-1',
        mapping: MAPPING,
        actorEmployeeId: 'e1',
        allowCreate: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
