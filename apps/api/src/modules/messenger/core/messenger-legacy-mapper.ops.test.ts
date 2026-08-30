import { describe, expect, it, vi } from 'vitest';
import { mapAllLegacyInternalToCore, mapLegacyChannelToCore } from './messenger-legacy-mapper.ops';

describe('Channel/DM → Core mapper', () => {
  it('is a no-op when the source Channel/DM store has 0 rows and does not drop tables', async () => {
    const prisma = {
      messengerChannel: { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn() },
      messengerDirectThread: { findMany: vi.fn().mockResolvedValue([]) },
      messengerLegacyIdentity: { findUnique: vi.fn() },
      $executeRaw: vi.fn(),
      $executeRawUnsafe: vi.fn(),
    };
    const result = await mapAllLegacyInternalToCore(prisma as never);
    expect(result).toEqual({ channels: 0, threads: 0 });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
    expect(prisma.$executeRawUnsafe).not.toHaveBeenCalled();
  });

  it('returns the existing Core conversation when remapping the same channel', async () => {
    const prisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue({ conversationId: 'core-1' }),
      },
      messengerChannel: { findUnique: vi.fn(), create: vi.fn() },
      messengerConversation: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    const first = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    const second = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(first?.conversationId).toBe('core-1');
    expect(second?.conversationId).toBe('core-1');
    expect(first?.created).toBe(false);
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns null for a missing source without deleting Channel tables', async () => {
    const prisma = {
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null) },
      messengerChannel: { findUnique: vi.fn().mockResolvedValue(null) },
      messengerConversation: { deleteMany: vi.fn() },
    };
    const result = await mapLegacyChannelToCore(prisma as never, 'missing');
    expect(result).toBeNull();
    expect(prisma.messengerConversation.deleteMany).not.toHaveBeenCalled();
  });

  it('sets canonicalKey legacy:channel:{id} on mapper create, not via HTTP', async () => {
    const tx = {
      messengerConversation: {
        create: vi.fn().mockResolvedValue({ id: 'core-new' }),
      },
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
      messengerMessage: { create: vi.fn() },
    };
    const prisma = {
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null) },
      messengerChannel: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ch-1',
          name: 'General',
          projectId: 'system',
          type: 'GENERAL',
          messages: [],
        }),
      },
      messengerConversation: { create: vi.fn() },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const result = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(result).toEqual({ conversationId: 'core-new', created: true, messageCount: 0 });
    expect(tx.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ canonicalKey: 'legacy:channel:ch-1' }),
      }),
    );
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
  });
});
