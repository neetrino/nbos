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
          readStates: [],
        }),
      },
      messengerConversation: { create: vi.fn() },
      employee: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const result = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(result).toEqual({ conversationId: 'core-new', created: true, messageCount: 0 });
    expect(tx.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          canonicalKey: 'legacy:channel:ch-1',
          lastMessageAt: null,
          type: 'INTERNAL_GROUP',
        }),
      }),
    );
    expect(prisma.messengerConversation.create).not.toHaveBeenCalled();
  });

  it('seeds VIEW-capable participants on an empty GENERAL channel', async () => {
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
          readStates: [],
        }),
      },
      employee: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'view-1' }])
          .mockResolvedValueOnce([
            {
              id: 'view-1',
              role: {
                permissions: [
                  { scope: 'OWN', permission: { action: 'VIEW' } },
                  { scope: 'NONE', permission: { action: 'EDIT' } },
                ],
              },
            },
          ]),
      },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(tx.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participants: {
            create: [{ employeeId: 'view-1', role: 'READ_ONLY' }],
          },
        }),
      }),
    );
    expect(tx.messengerMessage.create).not.toHaveBeenCalled();
  });

  it('maps PROJECT UUID team-graph members as participants', async () => {
    const projectId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const tx = {
      messengerConversation: {
        create: vi.fn().mockResolvedValue({ id: 'core-p' }),
      },
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      messengerMessage: { create: vi.fn() },
    };
    const prisma = {
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null) },
      messengerChannel: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'ch-p',
          name: 'Project',
          projectId,
          type: 'PROJECT',
          messages: [],
          readStates: [],
        }),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue({
          teamMembers: [{ employeeId: 'team-1' }],
          products: [],
          extensions: [],
          orders: [],
        }),
      },
      employee: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'team-1',
            role: {
              permissions: [
                { scope: 'OWN', permission: { action: 'VIEW' } },
                { scope: 'OWN', permission: { action: 'EDIT' } },
              ],
            },
          },
        ]),
      },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    await mapLegacyChannelToCore(prisma as never, 'ch-p');
    expect(tx.messengerConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participants: { create: [{ employeeId: 'team-1', role: 'MEMBER' }] },
        }),
      }),
    );
  });

  it('does not copy messages when remapping an already-mapped channel', async () => {
    const prisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue({ conversationId: 'core-1' }),
      },
      messengerChannel: {
        findUnique: vi.fn().mockResolvedValue({
          type: 'GENERAL',
          projectId: 'system',
          messages: [{ senderId: 'e1' }],
        }),
      },
      employee: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce([{ id: 'e2' }])
          .mockResolvedValueOnce([
            {
              id: 'e2',
              role: {
                permissions: [
                  { scope: 'OWN', permission: { action: 'VIEW' } },
                  { scope: 'OWN', permission: { action: 'EDIT' } },
                ],
              },
            },
          ]),
      },
      messengerConversationParticipant: {
        findMany: vi.fn().mockResolvedValue([{ employeeId: 'e1' }]),
        createMany: vi.fn(),
      },
      messengerConversation: { create: vi.fn() },
      messengerMessage: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    const result = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(result).toEqual({ conversationId: 'core-1', created: false, messageCount: 0 });
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ conversationId: 'core-1', employeeId: 'e2', role: 'MEMBER' }],
        skipDuplicates: true,
      }),
    );
  });
});
