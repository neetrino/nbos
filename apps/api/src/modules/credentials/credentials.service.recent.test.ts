import './credentials.service.fixture';
import { describe, it, expect, beforeEach } from 'vitest';
import { accessUser1, createCredentialsServiceTestContext } from './credentials.service.fixture';

describe('CredentialsService findRecent', () => {
  let service: ReturnType<typeof createCredentialsServiceTestContext>['service'];
  let prisma: ReturnType<typeof createCredentialsServiceTestContext>['prisma'];

  beforeEach(() => {
    const ctx = createCredentialsServiceTestContext();
    service = ctx.service;
    prisma = ctx.prisma;
  });

  it('returns visible credentials ordered by latest audit activity', async () => {
    prisma.auditLog.findMany.mockResolvedValue([
      { entityId: 'cred-2', createdAt: new Date('2026-06-01') },
      { entityId: 'cred-1', createdAt: new Date('2026-05-01') },
    ]);
    prisma.credential.findMany.mockResolvedValue([
      { id: 'cred-2', name: 'Newer', category: 'ADMIN' },
      { id: 'cred-1', name: 'Older', category: 'SERVICE' },
    ]);

    const result = await service.findRecent(accessUser1);

    expect(result.items.map((i) => i.id)).toEqual(['cred-2', 'cred-1']);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          entityType: 'credential',
        }),
      }),
    );
  });

  it('returns empty list when user has no recent audit rows', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    const result = await service.findRecent(accessUser1);
    expect(result.items).toEqual([]);
    expect(prisma.credential.findMany).not.toHaveBeenCalled();
  });
});
