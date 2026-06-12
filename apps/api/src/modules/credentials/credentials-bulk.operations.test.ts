import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { bulkArchiveCredentials } from './credentials-bulk.operations';
import type { CredentialsRuntime } from './credentials-runtime';

vi.mock('./credential-visibility.loader', () => ({
  buildCredentialRowVisibilityWhere: vi.fn().mockResolvedValue({}),
}));

function createRuntime(prisma: MockPrisma): CredentialsRuntime {
  return {
    prisma: prisma as never,
    encryptionKey: 'test-key',
    auditService: { log: vi.fn() } as never,
    notifications: {} as never,
    platformAccessResolver: {} as never,
    vaultSession: {} as never,
  };
}

describe('bulkArchiveCredentials', () => {
  let prisma: MockPrisma;
  let runtime: CredentialsRuntime;

  beforeEach(() => {
    prisma = createMockPrisma();
    runtime = createRuntime(prisma);
  });

  it('archives credentials and clears folder memberships in one transaction', async () => {
    prisma.credential.findMany.mockResolvedValue([
      { id: 'cred-1', projectId: null },
      { id: 'cred-2', projectId: 'project-1' },
    ]);

    const result = await bulkArchiveCredentials(
      runtime,
      { employeeId: 'emp-1', departmentIds: [] },
      ['cred-1', 'cred-2', 'skipped'],
    );

    expect(result).toEqual({
      succeeded: 2,
      skipped: 1,
      credentialIds: ['cred-1', 'cred-2'],
    });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.credentialFolderMembership.deleteMany).toHaveBeenCalledWith({
      where: { credentialId: { in: ['cred-1', 'cred-2'] } },
    });
    expect(prisma.credentialFavorite.deleteMany).toHaveBeenCalledWith({
      where: { credentialId: { in: ['cred-1', 'cred-2'] } },
    });
    expect(prisma.credential.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['cred-1', 'cred-2'] } },
        data: expect.objectContaining({ archivedAt: expect.any(Date) }),
      }),
    );
  });
});
