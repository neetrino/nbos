import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDriveInheritedLinkFileAccessWhere } from './drive-inherited-link-access';
import { buildDriveAssetAccessWhere } from './drive-asset-access.where';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';

function mockInheritedTargetQueries(prisma: MockPrisma) {
  prisma.project.findMany.mockResolvedValue([{ id: 'proj-1' }]);
  prisma.deal.findMany.mockResolvedValue([{ id: 'deal-1' }]);
  prisma.product.findMany.mockResolvedValue([]);
  prisma.task.findMany.mockResolvedValue([]);
  prisma.workSpace.findMany.mockResolvedValue([]);
  prisma.invoice.findMany.mockResolvedValue([{ id: 'inv-1' }]);
  prisma.payment.findMany.mockResolvedValue([]);
  prisma.expense.findMany.mockResolvedValue([]);
  prisma.partner.findMany.mockResolvedValue([]);
  prisma.company.findMany.mockResolvedValue([]);
  prisma.contact.findMany.mockResolvedValue([]);
  prisma.clientServiceRecord.findMany.mockResolvedValue([]);
}

describe('buildDriveInheritedLinkFileAccessWhere', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    mockInheritedTargetQueries(prisma);
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

  it('layers confidentiality: finance tier needs finance link, not deal alone', async () => {
    const where = await buildDriveInheritedLinkFileAccessWhere(prisma as never, {
      employeeId: 'emp-1',
      departmentIds: [],
      driveScope: 'OWN',
    });

    expect(prisma.invoice.findMany).toHaveBeenCalled();
    const serialized = JSON.stringify(where);
    expect(serialized).toContain('FINANCE_SENSITIVE');
    expect(serialized).toContain('INVOICE');
    expect(serialized).toContain('inv-1');
  });
});

describe('buildDriveAssetAccessWhere', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    mockInheritedTargetQueries(prisma);
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
