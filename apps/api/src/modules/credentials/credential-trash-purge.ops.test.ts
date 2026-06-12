import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { purgeTrashedCredentialsPastRetention } from './credential-trash-purge.ops';

describe('purgeTrashedCredentialsPastRetention', () => {
  let prisma: MockPrisma;
  const auditService = { log: vi.fn() };

  beforeEach(() => {
    prisma = createMockPrisma();
    auditService.log.mockReset();
  });

  it('purges trashed credentials past retention and writes audit', async () => {
    const now = new Date('2026-06-12T00:00:00.000Z');
    prisma.credential.findMany.mockResolvedValue([
      { id: 'cred-1', projectId: 'proj-1' },
      { id: 'cred-2', projectId: null },
    ]);
    prisma.credential.deleteMany.mockResolvedValue({ count: 2 });

    const result = await purgeTrashedCredentialsPastRetention(
      prisma as never,
      auditService as never,
      now,
    );

    expect(result.purged).toBe(2);
    expect(prisma.credential.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['cred-1', 'cred-2'] } },
    });
    expect(auditService.log).toHaveBeenCalledTimes(2);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'credential.retention_purged', entityId: 'cred-1' }),
    );
  });

  it('returns zero when no candidates', async () => {
    prisma.credential.findMany.mockResolvedValue([]);

    const result = await purgeTrashedCredentialsPastRetention(
      prisma as never,
      auditService as never,
      new Date(),
    );

    expect(result).toEqual({ purged: 0, candidateIds: [] });
    expect(prisma.credential.deleteMany).not.toHaveBeenCalled();
  });
});
