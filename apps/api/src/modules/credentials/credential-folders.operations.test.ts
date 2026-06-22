import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import {
  deleteCredentialFolder,
  removeCredentialFolderGrouping,
} from './credential-folders.operations';
import type { CredentialsRuntime } from './credentials-runtime';

const access = { employeeId: 'emp-1', departmentIds: [] as string[] };

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

describe('deleteCredentialFolder', () => {
  let prisma: MockPrisma;
  let runtime: CredentialsRuntime;

  beforeEach(() => {
    prisma = createMockPrisma();
    runtime = createRuntime(prisma);
  });

  it('hard-deletes empty folder and writes audit', async () => {
    prisma.credentialFolder.findFirst.mockResolvedValue({
      id: 'folder-1',
      projectId: 'project-1',
    });
    prisma.credentialFolderMembership.count.mockResolvedValue(0);
    prisma.credentialFolder.count.mockResolvedValue(0);

    await deleteCredentialFolder(runtime, 'folder-1', access);

    expect(prisma.credentialFolder.delete).toHaveBeenCalledWith({ where: { id: 'folder-1' } });
    expect(runtime.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'credential_folder.deleted',
        entityId: 'folder-1',
        entityType: 'credential_folder',
      }),
    );
  });

  it('blocks folder with active credential memberships', async () => {
    prisma.credentialFolder.findFirst.mockResolvedValue({
      id: 'folder-1',
      projectId: null,
    });
    prisma.credentialFolderMembership.count.mockResolvedValue(2);
    prisma.credentialFolder.count.mockResolvedValue(0);

    await expect(deleteCredentialFolder(runtime, 'folder-1', access)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.credentialFolder.delete).not.toHaveBeenCalled();
  });

  it('blocks folder with child folders', async () => {
    prisma.credentialFolder.findFirst.mockResolvedValue({
      id: 'folder-1',
      projectId: null,
    });
    prisma.credentialFolderMembership.count.mockResolvedValue(0);
    prisma.credentialFolder.count.mockResolvedValue(1);

    await expect(deleteCredentialFolder(runtime, 'folder-1', access)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.credentialFolder.delete).not.toHaveBeenCalled();
  });

  it('throws NotFound when folder is missing or archived', async () => {
    prisma.credentialFolder.findFirst.mockResolvedValue(null);

    await expect(deleteCredentialFolder(runtime, 'missing', access)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('removeCredentialFolderGrouping', () => {
  let prisma: MockPrisma;
  let runtime: CredentialsRuntime;

  beforeEach(() => {
    prisma = createMockPrisma();
    runtime = createRuntime(prisma);
  });

  it('unfiles credentials and deletes folder', async () => {
    prisma.credentialFolder.findFirst.mockResolvedValue({
      id: 'folder-1',
      projectId: 'project-1',
    });
    prisma.credentialFolder.count.mockResolvedValue(0);
    prisma.credentialFolderMembership.findMany.mockResolvedValue([
      { credentialId: 'cred-1' },
      { credentialId: 'cred-2' },
    ]);

    await removeCredentialFolderGrouping(runtime, 'folder-1', access);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.credentialFolderMembership.deleteMany).toHaveBeenCalledWith({
      where: { folderId: 'folder-1' },
    });
    expect(prisma.credentialFolder.delete).toHaveBeenCalledWith({ where: { id: 'folder-1' } });
    expect(runtime.auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'credential_folder.grouping_removed',
        changes: { unfiledCredentials: 2 },
      }),
    );
  });

  it('blocks when nested child folders exist', async () => {
    prisma.credentialFolder.findFirst.mockResolvedValue({
      id: 'folder-1',
      projectId: null,
    });
    prisma.credentialFolder.count.mockResolvedValue(1);

    await expect(removeCredentialFolderGrouping(runtime, 'folder-1', access)).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.credentialFolder.delete).not.toHaveBeenCalled();
  });
});
