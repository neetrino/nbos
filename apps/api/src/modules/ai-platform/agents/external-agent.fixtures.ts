import type { MockPrisma } from '../../../test-utils/mock-prisma';

export const OWNER_ID = 'emp-owner';
export const ACTOR_ID = 'emp-admin';

export function agentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'agent-1',
    name: 'Cursor Agent',
    description: null,
    status: 'ACTIVE',
    ownerId: OWNER_ID,
    createdById: ACTOR_ID,
    expiresAt: null,
    disabledAt: null,
    revokedAt: null,
    lastUsedAt: null,
    lastUsedIp: null,
    lastUsedChannel: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Mirrors `SELECT ... FOR UPDATE` followed by the locked read. */
export function lockRow(prisma: MockPrisma, row: ReturnType<typeof agentRow>): void {
  prisma.$queryRaw.mockResolvedValue([{ id: row.id }]);
  prisma.externalAgent.findUniqueOrThrow.mockResolvedValue(row);
}
