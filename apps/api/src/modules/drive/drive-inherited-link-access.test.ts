import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDriveInheritedLinkFileAccessWhere } from './drive-inherited-link-access';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('buildDriveInheritedLinkFileAccessWhere', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.project.findMany.mockResolvedValue([{ id: 'proj-1' }]);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.workSpace.findMany.mockResolvedValue([]);
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('returns empty match for ALL scope', async () => {
    const where = await buildDriveInheritedLinkFileAccessWhere(prisma as never, {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'ALL',
    });
    expect(where).toEqual({ id: { in: [] } });
  });

  it('includes file links to accessible projects for OWN scope', async () => {
    const where = await buildDriveInheritedLinkFileAccessWhere(prisma as never, {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'OWN',
    });
    expect(where).toEqual(
      expect.objectContaining({
        AND: expect.arrayContaining([
          expect.objectContaining({
            links: expect.objectContaining({
              some: expect.objectContaining({
                OR: expect.arrayContaining([{ entityType: 'PROJECT', entityId: 'proj-1' }]),
              }),
            }),
          }),
        ]),
      }),
    );
  });
});

describe('buildDriveAssetAccessWhere', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    prisma.project.findMany.mockResolvedValue([]);
    prisma.deal.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.workSpace.findMany.mockResolvedValue([]);
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('merges inherited link access for OWN scope', async () => {
    const where = await buildDriveAssetAccessWhere(prisma as never, {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'OWN',
    });
    expect(where).toEqual(
      expect.objectContaining({
        OR: expect.arrayContaining([
          expect.objectContaining({
            OR: expect.arrayContaining([expect.objectContaining({ ownerId: 'emp-1' })]),
          }),
        ]),
      }),
    );
  });
});
