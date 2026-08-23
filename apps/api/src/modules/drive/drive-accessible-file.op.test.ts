import { describe, expect, it } from 'vitest';
import { createMockPrisma } from '../../test-utils/mock-prisma';
import { findAccessibleFileAssetStorage } from './drive-accessible-file.op';

describe('findAccessibleFileAssetStorage', () => {
  it('loads storage only for a non-deleted FileAsset that passes Drive access where', async () => {
    const prisma = createMockPrisma();
    prisma.fileAsset.findFirst.mockResolvedValue({
      storageKey: 'org/recordings/a.ogg',
      mimeType: 'audio/ogg',
    });

    const result = await findAccessibleFileAssetStorage(prisma as never, 'file-1', {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'OWN',
    });

    expect(result).toEqual({ storageKey: 'org/recordings/a.ogg', mimeType: 'audio/ogg' });
    expect(prisma.fileAsset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'file-1', deletedAt: null }),
        select: { storageKey: true, mimeType: true },
      }),
    );
  });

  it('returns null when Drive policy does not expose the FileAsset', async () => {
    const prisma = createMockPrisma();
    const result = await findAccessibleFileAssetStorage(prisma as never, 'file-secret', {
      employeeId: 'emp-2',
      departmentIds: [],
      driveScope: 'OWN',
    });
    expect(result).toBeNull();
  });
});
