import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mapAllLegacyInternalToCore,
  mapLegacyChannelToCore,
  mapLegacyDirectThreadToCore,
} from './messenger-legacy-mapper.ops';

const bumpGlobalConversationRevision = vi.fn(async () => 1n);

function rematchChannelPrisma(
  tx: {
    messengerConversation: { findUnique: ReturnType<typeof vi.fn> };
    messengerConversationParticipant: { createMany: ReturnType<typeof vi.fn> };
  },
  existingParticipants: Array<{ employeeId: string }>,
  extras: {
    onError?: () => void;
    participants?: {
      findMany: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
    };
  } = {},
) {
  return {
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
      findMany: vi.fn().mockResolvedValue([
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
    messengerConversationParticipant: extras.participants ?? {
      findMany: vi.fn().mockResolvedValue(existingParticipants),
      createMany: vi.fn(),
    },
    messengerConversation: { create: vi.fn() },
    messengerMessage: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => {
      try {
        return await fn(tx);
      } catch (error) {
        extras.onError?.();
        throw error;
      }
    }),
  };
}

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: (...args: unknown[]) => bumpGlobalConversationRevision(...args),
}));

describe('Channel/DM → Core mapper', () => {
  beforeEach(() => {
    bumpGlobalConversationRevision.mockReset().mockResolvedValue(1n);
  });

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
    expect(bumpGlobalConversationRevision).not.toHaveBeenCalled();
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
    expect(bumpGlobalConversationRevision).toHaveBeenCalledTimes(1);
    expect(bumpGlobalConversationRevision).toHaveBeenCalledWith(tx, 'INTERNAL', 'core-new');
    expect(tx.messengerConversation.create.mock.invocationCallOrder[0]).toBeLessThan(
      bumpGlobalConversationRevision.mock.invocationCallOrder[0] ?? 0,
    );
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

  it('is a true no-op when remapping an existing channel with no missing participants', async () => {
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
          .mockResolvedValueOnce([{ id: 'e1' }])
          .mockResolvedValueOnce([
            {
              id: 'e1',
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
      messengerConversation: { create: vi.fn(), findUnique: vi.fn() },
      messengerMessage: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    const result = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(result).toEqual({ conversationId: 'core-1', created: false, messageCount: 0 });
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(bumpGlobalConversationRevision).not.toHaveBeenCalled();
  });

  it('bumps one INTERNAL revision after inserting missing participants on rematch', async () => {
    const tx = {
      messengerConversation: { findUnique: vi.fn().mockResolvedValue({ id: 'core-1' }) },
      messengerConversationParticipant: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = rematchChannelPrisma(tx, [{ employeeId: 'e1' }]);
    const result = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(result).toEqual({ conversationId: 'core-1', created: false, messageCount: 0 });
    expect(prisma.messengerMessage.create).not.toHaveBeenCalled();
    expect(prisma.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
    expect(tx.messengerConversationParticipant.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ conversationId: 'core-1', employeeId: 'e2', role: 'MEMBER' }],
        skipDuplicates: true,
      }),
    );
    expect(bumpGlobalConversationRevision).toHaveBeenCalledTimes(1);
    expect(bumpGlobalConversationRevision).toHaveBeenCalledWith(tx, 'INTERNAL', 'core-1');
    expect(tx.messengerConversationParticipant.createMany.mock.invocationCallOrder[0]).toBeLessThan(
      bumpGlobalConversationRevision.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('rolls back participant inserts when the rematch revision bump fails', async () => {
    const tx = {
      messengerConversation: { findUnique: vi.fn().mockResolvedValue({ id: 'core-1' }) },
      messengerConversationParticipant: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = rematchChannelPrisma(tx, [{ employeeId: 'e1' }], {
      onError: () => {
        tx.messengerConversationParticipant.createMany.mockClear();
      },
    });
    bumpGlobalConversationRevision.mockRejectedValue(new Error('counter failed'));
    await expect(mapLegacyChannelToCore(prisma as never, 'ch-1')).rejects.toThrow('counter failed');
    expect(tx.messengerConversationParticipant.createMany).not.toHaveBeenCalled();
  });

  it('does not bump again after missing participants have already been inserted', async () => {
    const tx = {
      messengerConversation: { findUnique: vi.fn().mockResolvedValue({ id: 'core-1' }) },
      messengerConversationParticipant: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const participants = {
      findMany: vi
        .fn()
        .mockResolvedValueOnce([{ employeeId: 'e1' }])
        .mockResolvedValueOnce([{ employeeId: 'e1' }, { employeeId: 'e2' }]),
      createMany: vi.fn(),
    };
    const prisma = rematchChannelPrisma(tx, [], { participants });
    await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(bumpGlobalConversationRevision).toHaveBeenCalledTimes(1);
    bumpGlobalConversationRevision.mockClear();
    const second = await mapLegacyChannelToCore(prisma as never, 'ch-1');
    expect(second).toEqual({ conversationId: 'core-1', created: false, messageCount: 0 });
    expect(bumpGlobalConversationRevision).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rolls back Channel mapping state when the revision bump fails', async () => {
    const tx = {
      messengerConversation: { create: vi.fn().mockResolvedValue({ id: 'core-fail' }) },
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
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
      employee: { findMany: vi.fn().mockResolvedValue([]) },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => {
        try {
          return await fn(tx);
        } catch (error) {
          tx.messengerConversation.create.mockClear();
          throw error;
        }
      }),
    };
    bumpGlobalConversationRevision.mockRejectedValue(new Error('counter failed'));
    await expect(mapLegacyChannelToCore(prisma as never, 'ch-1')).rejects.toThrow('counter failed');
    expect(tx.messengerConversation.create).not.toHaveBeenCalled();
  });

  it('bumps one INTERNAL revision after a new DirectThread mapping and skips remaps', async () => {
    const tx = {
      messengerConversation: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'core-dm' }),
        update: vi.fn(),
      },
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn() },
      messengerMessage: { create: vi.fn() },
    };
    const prisma = {
      messengerLegacyIdentity: { findUnique: vi.fn().mockResolvedValue(null) },
      messengerDirectThread: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'th-1',
          participantAId: 'e1',
          participantBId: 'e2',
          messages: [],
          readStates: [],
        }),
      },
      $transaction: vi.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };
    const created = await mapLegacyDirectThreadToCore(prisma as never, 'th-1');
    expect(created).toEqual({ conversationId: 'core-dm', created: true, messageCount: 0 });
    expect(bumpGlobalConversationRevision).toHaveBeenCalledTimes(1);
    expect(bumpGlobalConversationRevision).toHaveBeenCalledWith(tx, 'INTERNAL', 'core-dm');
    expect(tx.messengerConversation.create.mock.invocationCallOrder[0]).toBeLessThan(
      bumpGlobalConversationRevision.mock.invocationCallOrder[0] ?? 0,
    );

    bumpGlobalConversationRevision.mockClear();
    const remapPrisma = {
      messengerLegacyIdentity: {
        findUnique: vi.fn().mockResolvedValue({ conversationId: 'core-dm' }),
      },
      messengerConversation: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    const remapped = await mapLegacyDirectThreadToCore(remapPrisma as never, 'th-1');
    expect(remapped).toEqual({ conversationId: 'core-dm', created: false, messageCount: 0 });
    expect(bumpGlobalConversationRevision).not.toHaveBeenCalled();
    expect(remapPrisma.$transaction).not.toHaveBeenCalled();
  });
});
