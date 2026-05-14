import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DriveFolderService } from './drive-folder.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

const mockSend = vi.fn();

function makeR2Mock() {
  return {
    ensureS3: () => ({ send: mockSend }) as never,
    bucket: 'test-bucket',
  };
}

describe('DriveFolderService', () => {
  let prisma: MockPrisma;
  let service: DriveFolderService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    service = new DriveFolderService(prisma as never, makeR2Mock() as never);
    prisma.driveFolder.findUnique.mockResolvedValue({
      id: 'folder-1',
      space: 'COMPANY',
      ownerId: null,
      deletedAt: null,
    });
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
});
