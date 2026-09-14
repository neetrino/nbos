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

  it('lists legacy leadership previews for departments without seats', async () => {
    prisma.orgSeat.findMany.mockResolvedValue([]);
    prisma.department.findMany.mockResolvedValue([
      {
        id: 'sales',
        members: [
          { employeeId: 'e1', deptRole: 'DEPUTY' },
          { employeeId: 'e2', deptRole: 'HEAD' },
        ],
      },
    ]);
    const result = await service.findAll();
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          members: expect.objectContaining({
            where: {
              OR: [
                { deptRole: { in: Array.from(DEPARTMENT_LEADERSHIP_ROLES) } },
                { employeeId: { in: [] } },
              ],
            },
          }),
        }),
      }),
    );
    expect(result[0]?.members.map((member) => member.deptRole)).toEqual(['HEAD', 'DEPUTY']);
  });

  it('derives the leadership preview from seats and drops stale membership roles', async () => {
    prisma.orgSeat.findMany.mockResolvedValue([
      {
        id: 'seat-head',
        departmentId: 'sales',
        kind: 'STANDARD',
        department: { headSeatId: 'seat-head' },
        assignments: [{ employeeId: 'e1' }],
      },
    ]);
    prisma.department.findMany.mockResolvedValue([
      {
        id: 'sales',
        members: [
          { employeeId: 'e1', deptRole: 'MEMBER' },
          { employeeId: 'e2', deptRole: 'HEAD' },
        ],
      },
    ]);

    const result = await service.findAll();

    expect(result[0]?.members).toEqual([{ employeeId: 'e1', deptRole: 'HEAD' }]);
  });

  it('rewrites member roles from seats on the department detail', async () => {
    prisma.orgSeat.findMany.mockResolvedValue([
      {
        id: 'seat-deputy',
        departmentId: 'sales',
        kind: 'DEPUTY',
        department: { headSeatId: null },
        assignments: [{ employeeId: 'e2' }],
      },
    ]);
    prisma.department.findUnique.mockResolvedValue({
      id: 'sales',
      members: [
        { employeeId: 'e1', deptRole: 'HEAD' },
        { employeeId: 'e2', deptRole: 'MEMBER' },
      ],
    });

    const result = await service.findById('sales');

    expect(result.members).toEqual([
      { employeeId: 'e1', deptRole: 'MEMBER' },
      { employeeId: 'e2', deptRole: 'DEPUTY' },
    ]);
  });

  it('throws when a department is missing', async () => {
    prisma.department.findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });
});
