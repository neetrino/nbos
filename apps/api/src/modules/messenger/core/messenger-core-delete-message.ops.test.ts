import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { planOwnCoreMessageDelete } from './messenger-core-delete-message.ops';

describe('planOwnCoreMessageDelete', () => {
  it('plans only own messages in one conversation', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: 'a', senderId: 'me', conversationId: 'c1' },
      { id: 'b', senderId: 'other', conversationId: 'c1' },
    ]);
    const plan = await planOwnCoreMessageDelete({ messengerMessage: { findMany } } as never, 'me', [
      'a',
      'b',
    ]);
    expect(plan).toEqual({ conversationId: 'c1', deletedIds: ['a'] });
  });

  it('rejects when none of the messages belong to the caller', async () => {
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'b', senderId: 'other', conversationId: 'c1' }]);
    await expect(
      planOwnCoreMessageDelete({ messengerMessage: { findMany } } as never, 'me', ['b']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects when nothing is found', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    await expect(
      planOwnCoreMessageDelete({ messengerMessage: { findMany } } as never, 'me', ['x']),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
