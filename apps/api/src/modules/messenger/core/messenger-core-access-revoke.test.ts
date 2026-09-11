import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessengerCoreService } from './messenger-core.service';

const loadMessengerLegacyAccess = vi.fn();

vi.mock('../access/messenger-legacy-channel-access.op', () => ({
  loadMessengerLegacyAccess: (...args: unknown[]) => loadMessengerLegacyAccess(...args),
}));

vi.mock('./messenger-core-revision-tx', () => ({
  runMessengerWriteTx: async <T>(prisma: T, fn: (tx: T) => Promise<unknown>) => fn(prisma),
}));

vi.mock('./messenger-core-revision-write.ops', () => ({
  bumpGlobalConversationRevision: async () => 1n,
  bumpTargetedAccessRemovedRevision: async () => 1n,
}));

const ACTOR = {
  employeeId: 'e1',
  departmentIds: [],
  viewScope: 'ALL' as const,
  editScope: 'ALL' as const,
  clientReadScope: 'NONE' as const,
  clientSendScope: 'NONE' as const,
  driveViewScope: 'ALL',
};

const TARGET_OWN = {
  ...ACTOR,
  employeeId: 'e2',
  viewScope: 'OWN' as const,
  editScope: 'OWN' as const,
};

function createRevokeService() {
  const prisma = {
    messengerConversation: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'conv-1',
        zone: 'INTERNAL',
        type: 'INTERNAL_GROUP',
      }),
    },
    messengerConversationParticipant: {
      findFirst: vi.fn(),
      findUnique: vi.fn().mockResolvedValue({
        id: 'p2',
        employeeId: 'e2',
        role: 'MEMBER',
        leftAt: null,
      }),
      update: vi.fn().mockResolvedValue({
        employeeId: 'e2',
        role: 'MEMBER',
        leftAt: new Date(),
      }),
    },
    resourceAccessGrant: {
      findFirst: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const gateway = {
    evictEmployeeFromConversation: vi.fn().mockResolvedValue(undefined),
    publishPersistedCoreMessage: vi.fn(),
    emitCoreConversationMessage: vi.fn(),
    emitConversationReadUpdated: vi.fn(),
  };
  const service = new MessengerCoreService(
    prisma as never,
    gateway as never,
    { log: vi.fn().mockResolvedValue({ id: 'audit-1' }) } as never,
  );
  return { service, prisma, gateway };
}

describe('MessengerCoreService access revoke exactness', () => {
  beforeEach(() => {
    loadMessengerLegacyAccess.mockReset();
    loadMessengerLegacyAccess.mockImplementation(async (_prisma: unknown, employeeId: string) => {
      return employeeId === 'e2' ? TARGET_OWN : ACTOR;
    });
  });

  it('does not emit access_changed when a VIEW grant remains after participant revoke', async () => {
    const { service, prisma, gateway } = createRevokeService();
    prisma.messengerConversationParticipant.findFirst.mockImplementation(
      async ({ where }: { where: { employeeId: string } }) => {
        if (where.employeeId === 'e1') return { role: 'OWNER' };
        return null;
      },
    );
    prisma.resourceAccessGrant.findFirst.mockImplementation(
      async ({ where }: { where: { employeeId: string } }) => {
        if (where.employeeId === 'e2') return { level: 'VIEW' };
        return null;
      },
    );
    await service.revokeParticipant('conv-1', 'e1', 'e2');
    expect(gateway.evictEmployeeFromConversation).not.toHaveBeenCalled();
  });

  it('does not emit access_changed when a participant remains after override revoke', async () => {
    const { service, prisma, gateway } = createRevokeService();
    prisma.messengerConversationParticipant.findFirst.mockImplementation(
      async ({ where }: { where: { employeeId: string } }) => {
        return { role: where.employeeId === 'e1' ? 'OWNER' : 'MEMBER' };
      },
    );
    prisma.resourceAccessGrant.findFirst.mockResolvedValue(null);
    await service.revokeAccessOverride('conv-1', 'e1', 'e2');
    expect(gateway.evictEmployeeFromConversation).not.toHaveBeenCalled();
  });

  it('emits access_changed only after final access loss', async () => {
    const { service, prisma, gateway } = createRevokeService();
    prisma.messengerConversationParticipant.findFirst.mockImplementation(
      async ({ where }: { where: { employeeId: string } }) => {
        if (where.employeeId === 'e1') return { role: 'OWNER' };
        return null;
      },
    );
    prisma.resourceAccessGrant.findFirst.mockResolvedValue(null);
    await service.revokeParticipant('conv-1', 'e1', 'e2');
    expect(gateway.evictEmployeeFromConversation).toHaveBeenCalledWith('e2', 'conv-1', 'INTERNAL');
  });
});
