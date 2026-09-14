import { describe, expect, it, vi } from 'vitest';
import { createMockPrisma } from '../../test-utils/mock-prisma';
import type { CurrentUserPayload } from '../../common/decorators';
import { OrgSeatAssignmentsService } from './org-seat-assignments.service';

describe('OrgSeatAssignmentsService', () => {
  it('creates a scoped SEAT role grant and invalidates employee access', async () => {
    const { service, prisma, ownership } = harness();
    prisma.orgSeat.findUnique.mockResolvedValue(seatFixture());
    prisma.employee.findUnique.mockResolvedValue({ status: 'ACTIVE' });

    await service.assign(
      'seat-1',
      { employeeId: 'employee-1', allocationPct: 75, isPrimary: true },
      actorFixture(),
    );

    expect(ownership.assertCanAssignRole).toHaveBeenCalled();
    expect(prisma.employeeDepartment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { isPrimary: true },
      }),
    );
    expect(prisma.orgSeatAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          membershipProvisioned: true,
          previousPrimaryDepartmentId: null,
        }),
      }),
    );
    expect(prisma.permissionRoleAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employeeId: 'employee-1',
        roleId: 'role-sales',
        source: 'SEAT',
        scopeDepartmentId: 'department-sales',
      }),
    });
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'employee-1' },
      data: { accessVersion: { increment: 1 } },
    });
  });

  it('revokes only the permission assignment sourced by the ended seat', async () => {
    const { service, prisma } = harness();
    prisma.orgSeatAssignment.findUnique.mockResolvedValue({
      id: 'assignment-1',
      seatId: 'seat-1',
      employeeId: 'employee-1',
      status: 'ACTIVE',
      endsAt: null,
      startsAt: new Date('2026-01-01'),
      isPrimary: false,
      membershipProvisioned: true,
      previousPrimaryDepartmentId: null,
      seat: { id: 'seat-1', title: 'Seller', departmentId: 'department-sales' },
    });
    prisma.orgSeatAssignment.findUniqueOrThrow.mockResolvedValue(
      await prisma.orgSeatAssignment.findUnique(),
    );

    await service.end('assignment-1', actorFixture(), 'Transfer');

    expect(prisma.permissionRoleAssignment.updateMany).toHaveBeenCalledWith({
      where: { seatAssignmentId: 'assignment-1', revokedAt: null },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        effectiveTo: expect.any(Date),
        revokedById: 'actor-1',
      }),
    });
    expect(prisma.employeeDepartment.deleteMany).toHaveBeenCalledWith({
      where: {
        employeeId: 'employee-1',
        departmentId: 'department-sales',
      },
    });
  });
});

function harness() {
  const prisma = createMockPrisma();
  const audit = { log: vi.fn().mockResolvedValue(undefined) };
  const ownership = {
    assertCanAssignRole: vi.fn().mockResolvedValue(undefined),
    assertFounderNotMutatedByOthers: vi.fn().mockResolvedValue(undefined),
  };
  return {
    prisma,
    ownership,
    service: new OrgSeatAssignmentsService(prisma as never, audit as never, ownership as never),
  };
}

function seatFixture() {
  return {
    id: 'seat-1',
    departmentId: 'department-sales',
    title: 'Seller',
    kind: 'STANDARD',
    status: 'ACTIVE',
    defaultPermissionRoleId: 'role-sales',
    assignments: [],
    department: {
      id: 'department-sales',
      name: 'Sales',
      slug: 'sales',
      headSeatId: null,
    },
    defaultPermissionRole: {
      id: 'role-sales',
      name: 'Sales User',
      slug: 'sales-user',
      level: 4,
      assignable: true,
    },
  };
}

function actorFixture(): CurrentUserPayload {
  return {
    id: 'actor-1',
    email: 'ceo@example.com',
    firstName: 'Test',
    lastName: 'CEO',
    role: 'ceo',
    roleLevel: 2,
    departmentIds: [],
    permissions: { COMPANY_EDIT: 'ALL', SETTINGS_RBAC_EDIT: 'ALL' },
    isPlatformOwner: false,
  };
}
