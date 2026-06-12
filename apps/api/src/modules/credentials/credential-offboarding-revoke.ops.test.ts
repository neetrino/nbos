import { beforeEach, describe, expect, it } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { revokeCredentialAccessForOffboard } from './credential-offboarding-revoke.ops';

describe('revokeCredentialAccessForOffboard', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
  });

  it('revokes grants, clears SECRET allow-list, removes favorites, returns credential ids', async () => {
    prisma.resourceAccessGrant.findMany.mockResolvedValue([{ resourceId: 'c-grant' }]);
    prisma.credential.findMany.mockResolvedValue([
      { id: 'c-list', allowedEmployees: ['e1', 'e2'] },
    ]);
    prisma.resourceAccessGrant.updateMany.mockResolvedValue({ count: 1 });
    prisma.credential.update.mockResolvedValue({ id: 'c-list' });
    prisma.credentialFavorite.deleteMany.mockResolvedValue({ count: 2 });

    const result = await revokeCredentialAccessForOffboard(
      prisma as never,
      'e1',
      new Date('2026-06-12T12:00:00.000Z'),
    );

    expect(result.credentialIds).toEqual(['c-grant', 'c-list']);
    expect(result.credentialGrantsRevoked).toBe(1);
    expect(result.allowedEmployeesEntriesCleared).toBe(1);
    expect(result.favoritesRemoved).toBe(2);
    expect(prisma.credential.update).toHaveBeenCalledWith({
      where: { id: 'c-list' },
      data: { allowedEmployees: ['e2'] },
    });
  });
});
