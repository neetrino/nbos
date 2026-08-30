import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCoreMessageReference,
  deleteCoreMessageReference,
} from './messenger-core-reference.ops';

describe('MessageReference integrity', () => {
  const prisma = {
    messengerMessage: { findUnique: vi.fn() },
    messengerMessageReference: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a reference to a missing source message', async () => {
    prisma.messengerMessage.findUnique.mockResolvedValue(null);
    await expect(
      createCoreMessageReference(prisma as never, {
        sourceMessageId: 'missing',
        targetEntityType: 'TASK',
        targetEntityId: 'task-1',
        purpose: 'TASK_SOURCE',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.messengerMessageReference.create).not.toHaveBeenCalled();
  });

  it('creates a reference that points at the canonical source', async () => {
    prisma.messengerMessage.findUnique.mockResolvedValue({
      id: 'src-1',
      conversationId: 'conv-1',
    });
    prisma.messengerMessageReference.create.mockResolvedValue({
      id: 'ref-1',
      sourceMessageId: 'src-1',
    });
    const created = await createCoreMessageReference(prisma as never, {
      sourceMessageId: 'src-1',
      targetEntityType: 'TASK',
      targetEntityId: 'task-1',
      purpose: 'TASK_SOURCE',
    });
    expect(created.sourceMessageId).toBe('src-1');
    expect(prisma.messengerMessageReference.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceMessageId: 'src-1',
          sourceConversationId: 'conv-1',
        }),
      }),
    );
  });

  it('deletes a reference without deleting the source message', async () => {
    prisma.messengerMessageReference.findUnique.mockResolvedValue({ sourceMessageId: 'src-1' });
    prisma.messengerMessageReference.delete.mockResolvedValue({});
    const result = await deleteCoreMessageReference(prisma as never, 'ref-1');
    expect(result.sourceMessageId).toBe('src-1');
    expect(prisma.messengerMessage.delete).toBeUndefined();
    expect(prisma.messengerMessageReference.delete).toHaveBeenCalledWith({
      where: { id: 'ref-1' },
    });
  });
});
