import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN } from './messenger-core.constants';
import { createCoreExternalMapping } from './messenger-core-mapping.ops';
import { createCoreProviderSendOutbox } from './messenger-core-outbox.ops';

describe('core provider mapping / outbox hooks', () => {
  const prisma = {
    messengerConversation: {
      findUniqueOrThrow: vi.fn(),
    },
    messengerExternalConversationMapping: {
      create: vi.fn(),
    },
    messengerCommand: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects provider mapping on INTERNAL conversations', async () => {
    prisma.messengerConversation.findUniqueOrThrow.mockResolvedValue({
      id: 'conv-1',
      zone: 'INTERNAL',
    });
    await expect(
      createCoreExternalMapping(prisma as never, {
        conversationId: 'conv-1',
        provider: 'WHATSAPP',
        providerAccountId: 'acc',
        providerConversationId: 'chat',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      createCoreExternalMapping(prisma as never, {
        conversationId: 'conv-1',
        provider: 'WHATSAPP',
        providerAccountId: 'acc',
        providerConversationId: 'chat',
      }),
    ).rejects.toThrow(MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN);
    expect(prisma.messengerExternalConversationMapping.create).not.toHaveBeenCalled();
  });

  it('rejects provider-send outbox on INTERNAL conversations', async () => {
    prisma.messengerConversation.findUniqueOrThrow.mockResolvedValue({
      id: 'conv-1',
      zone: 'INTERNAL',
    });
    await expect(
      createCoreProviderSendOutbox(prisma as never, {
        conversationId: 'conv-1',
        idempotencyKey: 'k1',
      }),
    ).rejects.toThrow(/cannot enqueue provider send/);
    expect(prisma.messengerCommand.create).not.toHaveBeenCalled();
  });

  it('allows mapping hook on CLIENT conversations without dispatching Gateway', async () => {
    prisma.messengerConversation.findUniqueOrThrow.mockResolvedValue({
      id: 'conv-2',
      zone: 'CLIENT',
    });
    prisma.messengerExternalConversationMapping.create.mockResolvedValue({ id: 'map-1' });
    const created = await createCoreExternalMapping(prisma as never, {
      conversationId: 'conv-2',
      provider: 'WHATSAPP',
      providerAccountId: 'acc',
      providerConversationId: 'chat',
    });
    expect(created.id).toBe('map-1');
    expect(prisma.messengerExternalConversationMapping.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: 'conv-2',
          provider: 'WHATSAPP',
          externalAccountId: 'acc',
          externalConversationId: 'chat',
        }),
      }),
    );
  });
});
