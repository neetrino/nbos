import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistCoreMessage } from './messenger-core-message.ops';
import { assertCoreFileAssetsExist } from './messenger-core-attachment.ops';

describe('core message persistence', () => {
  const prisma = {
    messengerMessage: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    messengerConversation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
    },
    fileAsset: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.employee.findUnique.mockResolvedValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@nbos.test',
    });
    prisma.messengerConversation.update.mockResolvedValue({});
  });

  it('refuses to persist a message without a conversation', async () => {
    prisma.messengerMessage.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.findUnique.mockResolvedValue(null);
    await expect(
      persistCoreMessage(
        prisma as never,
        { conversationId: 'missing', senderId: 'e1', content: 'hello' },
        [],
      ),
    ).rejects.toThrow(/existing conversation/);
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
  });

  it('treats replyTo as optional and does not require a thread root', async () => {
    prisma.messengerMessage.findUnique.mockResolvedValue(null);
    prisma.messengerConversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      zone: 'INTERNAL',
    });
    prisma.messengerMessage.create.mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'e1',
      senderNameSnapshot: 'Ada Lovelace',
      content: 'hello',
      direction: 'INTERNAL',
      status: 'SENT',
      provenance: 'EMPLOYEE',
      replyToMessageId: null,
      threadRootMessageId: null,
      createdAt: new Date(),
      editedAt: null,
      attachments: [],
    });
    const created = await persistCoreMessage(
      prisma as never,
      { conversationId: 'conv-1', senderId: 'e1', content: 'hello' },
      [],
    );
    expect(created.replyToMessageId).toBeNull();
    expect(created.threadRootMessageId).toBeNull();
    expect(prisma.messengerMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          replyToMessageId: undefined,
          threadRootMessageId: undefined,
        }),
      }),
    );
  });

  it('returns the existing row for a duplicate idempotency key', async () => {
    prisma.messengerMessage.findUnique.mockResolvedValue({
      id: 'msg-dup',
      conversationId: 'conv-1',
      senderId: 'e1',
      senderNameSnapshot: 'Ada Lovelace',
      content: 'hello',
      direction: 'INTERNAL',
      status: 'SENT',
      provenance: 'EMPLOYEE',
      replyToMessageId: null,
      threadRootMessageId: null,
      createdAt: new Date(),
      editedAt: null,
      attachments: [],
    });
    const first = await persistCoreMessage(
      prisma as never,
      { conversationId: 'conv-1', senderId: 'e1', content: 'hello', idempotencyKey: 'k1' },
      [],
    );
    const second = await persistCoreMessage(
      prisma as never,
      { conversationId: 'conv-1', senderId: 'e1', content: 'hello', idempotencyKey: 'k1' },
      [],
    );
    expect(first.id).toBe('msg-dup');
    expect(second.id).toBe('msg-dup');
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
  });
});

describe('attachment FileAsset reference', () => {
  it('fails closed when a FileAsset id does not exist', async () => {
    const prisma = {
      fileAsset: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await expect(assertCoreFileAssetsExist(prisma as never, ['missing-asset'])).rejects.toThrow(
      /existing Drive FileAsset/,
    );
  });
});
