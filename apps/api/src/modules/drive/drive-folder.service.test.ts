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
});
