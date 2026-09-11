import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { persistCoreMessage } from './messenger-core-message.ops';
import { whatsAppOutboundIdempotencyKey } from './messenger-wa-identity';

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: vi.fn(async () => 1n),
}));

const CHAT = '37499111222@c.us';
const RELINKED = '37499333444@c.us';

function existingQueued() {
  return {
    id: 'msg-1',
    conversationId: 'conv-c',
    senderId: 'e1',
    senderNameSnapshot: 'Ada',
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

function replayPrisma(commandRow: object | null) {
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    messengerMessage: {
      findUnique: vi.fn().mockResolvedValue(existingQueued()),
      create: vi.fn(),
    },
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue({ id: 'conv-c', zone: 'CLIENT' }),
      update: vi.fn(),
    },
    messengerCommand: {
      findUnique: vi.fn().mockResolvedValue(commandRow),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: 'a1' }) },
  };
  return {
    prisma: {
      $transaction: vi.fn(async (fn: (inner: typeof tx) => Promise<unknown>) => fn(tx)),
    },
    tx,
  };
}

const matchingCommand = {
  id: 'cmd-1',
  status: 'PENDING',
  kind: 'SEND_MESSAGE',
  resultMessageId: 'msg-1',
  conversationId: 'conv-c',
  payload: { accountId: 'acc_a', chatId: CHAT },
};

describe('P4B-13 HTTP replay mapping drift', () => {
  async function replay(mappingChat: string, prisma: object) {
    return persistCoreMessage(
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
      { mapping: { externalAccountId: 'acc_a', externalConversationId: mappingChat } },
    );
  }

  it('returns the original message when mapping is unchanged', async () => {
    const { prisma, tx } = replayPrisma(matchingCommand);
    const result = await replay(CHAT, prisma);
    expect(result.id).toBe('msg-1');
    expect(tx.messengerCommand.createMany).not.toHaveBeenCalled();
  });

  it('returns the original message when mapping was relinked', async () => {
    const { prisma, tx } = replayPrisma(matchingCommand);
    const result = await replay(RELINKED, prisma);
    expect(result.id).toBe('msg-1');
    expect(tx.messengerCommand.createMany).not.toHaveBeenCalled();
  });

  it('returns the original message when mapping was removed', async () => {
    const { prisma, tx } = replayPrisma(matchingCommand);
    const result = await persistCoreMessage(
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
    );
    expect(result.id).toBe('msg-1');
    expect(tx.messengerCommand.createMany).not.toHaveBeenCalled();
  });

  it('repairs a missing command using the current mapping', async () => {
    const { prisma, tx } = replayPrisma(null);
    tx.messengerCommand.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({
        ...matchingCommand,
        payload: { accountId: 'acc_a', chatId: RELINKED },
      });
    await replay(RELINKED, prisma);
    expect(tx.messengerCommand.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            idempotencyKey: whatsAppOutboundIdempotencyKey('msg-1'),
            payload: { accountId: 'acc_a', chatId: RELINKED },
          }),
        ],
      }),
    );
  });

  it('409s a colliding command identity', async () => {
    const { prisma } = replayPrisma({
      ...matchingCommand,
      conversationId: 'conv-other',
      resultMessageId: 'msg-other',
    });
    await expect(replay(CHAT, prisma)).rejects.toBeInstanceOf(ConflictException);
  });
});
