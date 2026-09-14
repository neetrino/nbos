import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DEPARTMENT_LEADERSHIP_ROLES } from './department-member.constants';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { AuditService } from '../audit/audit.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: MockPrisma;
  const auditService: Pick<AuditService, 'log'> = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DepartmentsService(prisma as never, auditService as AuditService);
  });

  it('lists departments with leadership member previews', async () => {
    prisma.department.findMany.mockResolvedValue([
      { id: 'sales', members: [{ deptRole: 'DEPUTY' }, { deptRole: 'HEAD' }] },
    ]);
    const result = await service.findAll();
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          members: expect.objectContaining({
            where: { deptRole: { in: Array.from(DEPARTMENT_LEADERSHIP_ROLES) } },
          }),
        }),
      }),
    );
    expect(result[0]?.members.map((member) => member.deptRole)).toEqual(['HEAD', 'DEPUTY']);
  });

  it('throws when a department is missing', async () => {
    prisma.department.findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });
});
