import { beforeEach, describe, expect, it } from 'vitest';
import { DriveLibraryEntitiesService } from './drive-library-entities.service';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

describe('DriveLibraryEntitiesService', () => {
  let prisma: MockPrisma;
  let service: DriveLibraryEntitiesService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DriveLibraryEntitiesService(prisma as never);
    prisma.employeeDepartment.findMany.mockResolvedValue([]);
  });

  it('filters projects when Drive scope is OWN', async () => {
    prisma.project.findMany.mockResolvedValue([{ id: 'p1', code: 'P-1', name: 'Alpha' }]);

    const result = await service.listForLibrary('projects', {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'OWN',
    });

    expect(result.items).toEqual([
      { id: 'p1', entityType: 'PROJECT', label: 'Alpha', code: 'P-1' },
    ]);
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
        take: 60,
      }),
    );
  });

  it('lists projects without participation filter when Drive scope is ALL', async () => {
    prisma.project.findMany.mockResolvedValue([]);

    await service.listForLibrary('projects', {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'ALL',
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
