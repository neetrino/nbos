import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { DriveTypedExportResolver } from './drive-typed-export-resolver';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('DriveTypedExportResolver', () => {
  let prisma: MockPrisma;
  let resolver: DriveTypedExportResolver;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    resolver = new DriveTypedExportResolver(prisma as never);
    prisma.project.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.project.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.deal.findUnique.mockResolvedValue({ id: 'deal-1' });
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.fileAsset.findMany.mockResolvedValue([{ id: 'file-1' }]);
  });

  it('resolves project export file ids after entity access check', async () => {
    const result = await resolver.resolveFileIds(
      'drive.project_zip',
      { projectId: 'p1' },
      { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
    );

    expect(result.exportKind).toBe('drive.project_zip');
    expect(result.fileIds).toEqual(['file-1']);
    expect(prisma.project.findFirst).toHaveBeenCalled();
  });

  it('rejects project export when project graph is inaccessible', async () => {
    prisma.project.findFirst.mockResolvedValueOnce(null);

    await expect(
      resolver.resolveFileIds(
        'drive.project_zip',
        { projectId: 'p1' },
        { employeeId: 'user-1', departmentIds: [], driveScope: 'OWN' },
      ),
    ).rejects.toThrow('Drive context not found');
  });

  it('resolves offer export with purpose filter', async () => {
    const result = await resolver.resolveFileIds(
      'drive.offer_zip',
      { dealId: 'deal-1' },
      { employeeId: 'user-1', departmentIds: [], driveScope: 'ALL' },
    );

    expect(result.exportKind).toBe('drive.offer_zip');
    expect(result.fileIds).toEqual(['file-1']);
    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          purpose: { in: expect.arrayContaining(['OFFER']) },
        }),
      }),
    );
  });

  it('rejects selection_zip without explicit file ids', async () => {
    await expect(
      resolver.resolveFileIds(
        'drive.selection_zip',
        {},
        { employeeId: 'user-1', departmentIds: [], driveScope: 'ALL' },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
