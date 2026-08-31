import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN } from './messenger-core.constants';
import { ensureMetaClientConversation } from './messenger-meta-ensure.ops';
import { persistMetaInboundCoreMessageTx } from './messenger-meta-inbound.ops';
import { mapAllMetaSalesToCore } from './messenger-meta-mapper.ops';
import { persistLiveMetaInboundToCore } from './messenger-meta-live-inbound.ops';
import { metaProviderMessageKey } from './messenger-meta-identity';
import { legacyMetaCanonicalKey } from './messenger-core-canonical-key';

const persistCoreMessage = vi.fn();

vi.mock('./messenger-core-message.ops', () => ({
  persistCoreMessage: (...args: unknown[]) => persistCoreMessage(...args),
}));

describe('Meta Sales mapper', () => {
  it('is a no-op when MetaConversation count is 0', async () => {
    const prisma = {
      metaConversation: { findMany: vi.fn().mockResolvedValue([]) },
    };
    await expect(mapAllMetaSalesToCore(prisma as never)).resolves.toEqual({
      conversationsSeen: 0,
      conversationsMapped: 0,
      conversationsReused: 0,
      messagesSeen: 0,
      messagesMapped: 0,
      messagesSkippedExisting: 0,
    });
  });

  it('reuses proven identity and does not copy the same Meta message twice', async () => {
    persistCoreMessage.mockReset();
    const prisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue({
          conversationId: 'core-1',
          messageId: 'core-msg-1',
        }),
        createMany: vi.fn(),
        upsert: vi.fn(),
      },
      messengerConversation: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'core-1', zone: 'CLIENT' }),
      },
      messengerExternalConversationMapping: {
        upsert: vi.fn().mockResolvedValue({ id: 'map-1' }),
      },
      messengerConversationLink: { createMany: vi.fn() },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };
    const first = await persistMetaInboundCoreMessageTx(prisma as never, {
      conversationId: 'core-1',
      providerMessageKey: metaProviderMessageKey('INSTAGRAM', 'acc-1', 'mid-1'),
      content: 'hello',
      senderName: 'Karo',
      direction: 'INBOUND',
      createdAt: new Date(),
    });
    expect(first.created).toBe(false);
    expect(persistCoreMessage).not.toHaveBeenCalled();
  });

  it('sets server-owned legacy:meta canonicalKey and does not write MetaMessage', async () => {
    const created = { id: 'core-1' };
    const prisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue(null),
        createMany: vi.fn(),
      },
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'core-1', zone: 'CLIENT' }),
      },
      messengerExternalConversationMapping: {
        upsert: vi.fn().mockResolvedValue({ id: 'map-1' }),
      },
      messengerConversationLink: { createMany: vi.fn() },
      metaMessage: { create: vi.fn() },
    };
    const result = await ensureMetaClientConversation(prisma as never, {
      metaConversationId: 'meta-1',
      provider: 'INSTAGRAM',
      providerAccountId: 'acc-1',
      title: 'Karo',
      leadId: 'lead-1',
    });
    expect(result.created).toBe(true);
    expect(prisma.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          zone: 'CLIENT',
          type: 'EXTERNAL',
          canonicalKey: legacyMetaCanonicalKey('meta-1'),
        }),
      }),
    );
    expect(prisma.metaMessage.create).not.toHaveBeenCalled();
  });

  it('persists inbound Meta with PROVIDER provenance and null senderId', async () => {
    persistCoreMessage.mockReset().mockResolvedValue({
      id: 'core-msg-new',
      conversationId: 'core-1',
      senderId: null,
      provenance: 'PROVIDER',
    });
    const prisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      },
    };
    const persisted = await persistMetaInboundCoreMessageTx(prisma as never, {
      conversationId: 'core-1',
      providerMessageKey: metaProviderMessageKey('FACEBOOK', 'acc-1', 'mid-2'),
      content: 'hello',
      senderName: 'Karo',
      direction: 'INBOUND',
      createdAt: new Date(),
    });
    expect(persisted.created).toBe(true);
    expect(persistCoreMessage).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        senderId: null,
        provenance: 'PROVIDER',
        direction: 'INBOUND',
      }),
      [],
    );
    expect(prisma.messengerLegacyIdentity.upsert).toHaveBeenCalled();
  });

  it('rejects Meta mapping onto an Internal conversation', async () => {
    const prisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue({ conversationId: 'internal-1' }),
        createMany: vi.fn(),
      },
      messengerConversation: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'internal-1', zone: 'INTERNAL' }),
      },
      messengerExternalConversationMapping: { upsert: vi.fn() },
      messengerConversationLink: { createMany: vi.fn() },
    };
    await expect(
      ensureMetaClientConversation(prisma as never, {
        metaConversationId: 'meta-1',
        provider: 'INSTAGRAM',
        providerAccountId: 'acc-1',
        title: 'Karo',
        leadId: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      persistLiveMetaInboundToCore(prisma as never, {
        metaConversationId: 'meta-1',
        leadId: null,
        providerAccountId: 'acc-1',
        platform: 'INSTAGRAM',
        providerMessageId: 'mid-1',
        text: 'hi',
        senderName: 'Karo',
        sentAt: new Date(),
      }),
    ).rejects.toThrow(MESSENGER_CORE_INTERNAL_PROVIDER_FORBIDDEN);
  });
});
