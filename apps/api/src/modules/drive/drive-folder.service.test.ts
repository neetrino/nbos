import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveFolderService } from './drive-folder.service';
import { DRIVE_ROOT_STORAGE_FOLDER_NAME } from './drive-root-folder.constants';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

const mockSend = vi.fn();

const TEST_ORG_ID = '00000000-0000-4000-8000-000000000001';

function makeR2Mock() {
  return {
    ensureS3: () => ({ send: mockSend }) as never,
    bucket: 'test-bucket',
  };
}

function makeConfigMock() {
  return {
    get: (key: string) => (key === 'NBOS_TENANT_ORGANIZATION_ID' ? TEST_ORG_ID : undefined),
  };
}

describe('DriveFolderService', () => {
  let prisma: MockPrisma;
  let service: DriveFolderService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.driveFolder.findUnique.mockResolvedValue({
      id: 'folder-1',
      space: 'COMPANY',
      ownerId: null,
      deletedAt: null,
      scopeEntityType: null,
      scopeEntityId: null,
    });
    service = new DriveFolderService(
      prisma as never,
      makeR2Mock() as never,
      makeConfigMock() as never,
    );
  });

  it('removes only the folder placement', async () => {
    prisma.driveFolderItem.findFirst.mockResolvedValue({ id: 'placement-1' });

    await service.removeFile('folder-1', 'file-1', 'user-1');

    expect(prisma.driveFolderItem.update).toHaveBeenCalledWith({
      where: { id: 'placement-1' },
      data: { removedAt: expect.any(Date) },
    });
  });

  it('moves the existing placement to another folder', async () => {
    prisma.driveFolderItem.findFirst.mockResolvedValue({ id: 'placement-1' });
    prisma.driveFolderItem.update.mockResolvedValue({ fileAsset: { id: 'file-1' } });

    await service.moveFile('folder-1', 'folder-2', 'file-1', 'user-1');

    expect(prisma.driveFolderItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'placement-1' },
        data: expect.objectContaining({ folderId: 'folder-2', placedById: 'user-1' }),
      }),
    );
  });

  it('copies into a new independent FileAsset', async () => {
    prisma.driveFolder.findUnique.mockResolvedValue({
      id: 'folder-2',
      space: 'COMPANY',
      ownerId: null,
      deletedAt: null,
      scopeEntityType: null,
      scopeEntityId: null,
    });
    prisma.fileAsset.findUnique.mockResolvedValue({
      id: 'file-1',
      displayName: 'Contract.pdf',
      originalName: 'Contract.pdf',
      fileType: 'DOCUMENT',
      purpose: 'CONTRACT',
      visibility: 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
      storageProvider: 'R2',
      storageKey: 'Drive/uploads/source/Contract.pdf',
      externalUrl: null,
      mimeType: 'application/pdf',
      sizeBytes: 123n,
      checksum: 'abc',
      deletedAt: null,
    });
    prisma.fileAsset.create.mockResolvedValue({ id: 'file-copy', links: [], versions: [] });
    mockSend.mockResolvedValue({});

    const copied = await service.copyFile('folder-2', 'file-1', 'user-1');

    expect(copied.id).toBe('file-copy');
    expect(mockSend).toHaveBeenCalled();
    expect(prisma.fileAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayName: 'Contract.pdf copy',
          folderPlacements: {
            create: { folderId: 'folder-2', itemType: 'FILE', placedById: 'user-1' },
          },
        }),
      }),
    );
  });

  it('lists folder tree for a space', async () => {
    prisma.driveFolder.findMany.mockResolvedValue([
      { id: 'a', name: 'Alpha', space: 'COMPANY', parentId: null },
    ]);
    const result = (await service.listFolderTree('COMPANY', 'user-1')) as {
      space: string;
      folders: { id: string }[];
    };
    expect(result.space).toBe('COMPANY');
    expect(result.folders).toHaveLength(1);
    expect(prisma.driveFolder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ space: 'COMPANY', deletedAt: null }),
      }),
    );
  });

  it('renames a folder', async () => {
    prisma.driveFolder.update.mockResolvedValue({ id: 'folder-1', name: 'Renamed' });
    const out = await service.renameFolder('folder-1', { name: 'Renamed' }, 'user-1');
    expect((out as { name: string }).name).toBe('Renamed');
    expect(prisma.driveFolder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'folder-1' },
        data: { name: 'Renamed' },
      }),
    );
  });

  it('soft-deletes an empty folder in a transaction', async () => {
    prisma.driveFolder.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    await service.deleteFolder('folder-1', 'user-1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.driveFolderItem.updateMany).toHaveBeenCalled();
    expect(prisma.driveFolder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'folder-1' },
        data: { deletedAt: expect.any(Date) },
      }),
    );
  });

  it('refuses delete when the folder has child folders', async () => {
    prisma.driveFolder.count.mockResolvedValueOnce(1);
    await expect(service.deleteFolder('folder-1', 'user-1')).rejects.toThrow('subfolders');
  });

  it('lists root files against the hidden root storage folder', async () => {
    prisma.driveFolder.findFirst.mockResolvedValueOnce({
      id: 'root-bucket',
      name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
      parentId: null,
      space: 'COMPANY',
      ownerId: null,
      scopeEntityType: null,
      scopeEntityId: null,
    });
    prisma.driveFolder.findUnique.mockResolvedValue({
      id: 'root-bucket',
      name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
      parentId: null,
      space: 'COMPANY',
      ownerId: null,
      deletedAt: null,
      scopeEntityType: null,
      scopeEntityId: null,
    });
    prisma.driveFolder.findMany.mockResolvedValueOnce([]);
    prisma.driveFolderItem.findMany.mockResolvedValueOnce([]);
    const result = (await service.listFolder({ space: 'COMPANY', parentId: 'root' }, 'user-1')) as {
      rootStorageFolderId: string;
      folders: unknown[];
    };
    expect(result.rootStorageFolderId).toBe('root-bucket');
    expect(result.folders).toEqual([]);
    expect(prisma.driveFolderItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ folderId: 'root-bucket', itemType: 'FILE' }),
      }),
    );
  });

  it('lists entity-scoped project root with scoped storage folder', async () => {
    prisma.driveFolder.findFirst.mockResolvedValueOnce({
      id: 'project-root-a',
      name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
      parentId: null,
      space: 'COMPANY',
      ownerId: null,
      scopeEntityType: 'PROJECT',
      scopeEntityId: 'project-a',
    });
    prisma.driveFolder.findUnique.mockResolvedValue({
      id: 'project-root-a',
      name: DRIVE_ROOT_STORAGE_FOLDER_NAME,
      parentId: null,
      space: 'COMPANY',
      ownerId: null,
      deletedAt: null,
      scopeEntityType: 'PROJECT',
      scopeEntityId: 'project-a',
    });
    prisma.driveFolder.findMany.mockResolvedValueOnce([]);
    prisma.driveFolderItem.findMany.mockResolvedValueOnce([]);

    const result = (await service.listFolder(
      { scopeEntityType: 'PROJECT', scopeEntityId: 'project-a', parentId: 'root' },
      'user-1',
    )) as {
      rootStorageFolderId: string;
      scopeEntityId: string | null;
      files: unknown[];
    };

    expect(result.rootStorageFolderId).toBe('project-root-a');
    expect(result.scopeEntityId).toBe('project-a');
    expect(result.files).toEqual([]);
    expect(prisma.driveFolder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scopeEntityType: 'PROJECT',
          scopeEntityId: 'project-a',
        }),
      }),
    );
  });
});
