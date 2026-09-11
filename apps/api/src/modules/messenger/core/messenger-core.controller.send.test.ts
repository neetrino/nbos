import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MessengerCoreController } from './messenger-core.controller';
import { MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN } from './messenger-core.constants';

const USER = { id: 'e1' };
const BODY = { content: 'hi' };

describe('MessengerCoreController persist (FINDING-S8-02)', () => {
  it('does not dispatch WhatsApp from Core persist against a CLIENT conversation', async () => {
    const core = {
      getConversation: vi.fn().mockResolvedValue({ id: 'c1', zone: 'CLIENT' }),
      persistAndBroadcast: vi.fn(),
    };
    const controller = new MessengerCoreController(core as never);
    await expect(controller.sendMessage('c1', USER as never, BODY as never)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.sendMessage('c1', USER as never, BODY as never)).rejects.toThrow(
      MESSENGER_CORE_INTERNAL_CLIENT_ZONE_FORBIDDEN,
    );
    expect(core.persistAndBroadcast).not.toHaveBeenCalled();
  });

  it('still persists INTERNAL conversations without calling a leftover Client send', async () => {
    const core = {
      getConversation: vi.fn().mockResolvedValue({ id: 'g1', zone: 'INTERNAL' }),
      persistAndBroadcast: vi.fn().mockResolvedValue({ id: 'm1' }),
    };
    const controller = new MessengerCoreController(core as never);
    await controller.sendMessage('g1', USER as never, BODY as never);
    expect(core.persistAndBroadcast).toHaveBeenCalledTimes(1);
    expect(core.persistAndBroadcast).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'g1', senderId: 'e1' }),
    );
  });
});
