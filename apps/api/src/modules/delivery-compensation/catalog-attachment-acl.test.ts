import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertCatalogAttachmentAllowed } from './catalog-attachment-acl';

vi.mock('../drive/drive-asset-access.where', () => ({
  buildDriveAssetAccessWhere: vi.fn(),
}));

import { buildDriveAssetAccessWhere } from '../drive/drive-asset-access.where';

const access = { employeeId: 'emp-1', departmentIds: [] };

describe('assertCatalogAttachmentAllowed', () => {
  const prisma = {
    fileAsset: { findFirst: vi.fn() },
    driveFolderItem: { findFirst: vi.fn() },
  };

  beforeEach(() => {
    vi.mocked(buildDriveAssetAccessWhere).mockReset();
    prisma.fileAsset.findFirst.mockReset();
    prisma.driveFolderItem.findFirst.mockReset();
    vi.mocked(buildDriveAssetAccessWhere).mockResolvedValue({ id: 'file-1' });
    prisma.driveFolderItem.findFirst.mockResolvedValue(null);
  });

  it('allows an internal company file the actor can view', async () => {
    prisma.fileAsset.findFirst.mockResolvedValue({
      visibility: 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
    });

    await expect(
      assertCatalogAttachmentAllowed(prisma as never, 'file-1', access),
    ).resolves.toBeUndefined();
    expect(buildDriveAssetAccessWhere).toHaveBeenCalledWith(prisma, access);
  });

  it('hides files outside Drive access as not found', async () => {
    prisma.fileAsset.findFirst.mockResolvedValue(null);
    await expect(
      assertCatalogAttachmentAllowed(prisma as never, 'file-1', access),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects personal visibility even when Drive access passed', async () => {
    prisma.fileAsset.findFirst.mockResolvedValue({
      visibility: 'PERSONAL',
      confidentiality: 'CONFIDENTIAL',
    });

    await expect(
      assertCatalogAttachmentAllowed(prisma as never, 'file-1', access),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a file that still sits in Personal Drive', async () => {
    prisma.fileAsset.findFirst.mockResolvedValue({
      visibility: 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
    });
    prisma.driveFolderItem.findFirst.mockResolvedValue({ id: 'place-1' });

    await expect(
      assertCatalogAttachmentAllowed(prisma as never, 'file-1', access),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
