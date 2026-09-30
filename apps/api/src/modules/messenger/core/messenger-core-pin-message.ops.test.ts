import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { pinCoreConversationMessage } from './messenger-core-pin-message.ops';

describe('pinCoreConversationMessage', () => {
  it('pins a message that belongs to the conversation', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'm1',
      senderNameSnapshot: 'Ada',
      content: 'hello',
    });
    const update = vi.fn().mockResolvedValue({});
    const result = await pinCoreConversationMessage(
      { messengerMessage: { findFirst }, messengerConversation: { update } } as never,
      'c1',
      'm1',
    );
    expect(result).toEqual({ id: 'm1', senderName: 'Ada', content: 'hello' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { pinnedMessageId: 'm1' },
    });
  });

  it('rejects a missing message', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    await expect(
      pinCoreConversationMessage(
        { messengerMessage: { findFirst }, messengerConversation: { update: vi.fn() } } as never,
        'c1',
        'm1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
