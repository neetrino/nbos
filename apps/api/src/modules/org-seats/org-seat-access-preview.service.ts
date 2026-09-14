import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { activeAdditionalRoleAssignments } from '../../common/authorization/active-role-assignments';
import { buildEmployeeAuthorizationContext } from '../../common/authorization/employee-authorization-context';
import type { PreviewOrgSeatDto } from './org-seat.dto';
import { ACTIVE_SEAT_ASSIGNMENT_WHERE } from './org-seat.select';

const ROLE_INCLUDE = { permissions: { include: { permission: true } } } as const;

@Injectable()
export class OrgSeatAccessPreviewService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async preview(seatId: string, input: PreviewOrgSeatDto) {
    const [employee, seat] = await Promise.all([
      this.prisma.employee.findUnique({
        where: { id: input.employeeId },
        include: {
          role: { include: ROLE_INCLUDE },
          departments: true,
          permissionRoleAssignments: {
            where: activeAdditionalRoleAssignments(new Date()),
            include: { role: { include: ROLE_INCLUDE } },
          },
          seatAssignments: {
            where: ACTIVE_SEAT_ASSIGNMENT_WHERE,
            include: { seat: { select: { departmentId: true } } },
          },
        },
      }),
      this.prisma.orgSeat.findUnique({
        where: { id: seatId },
        include: { defaultPermissionRole: { include: ROLE_INCLUDE } },
      }),
    ]);
    if (!employee || !seat) throw new NotFoundException('Employee or seat not found.');
    if (employee.status === 'TERMINATED') throw new BadRequestException('Employee is terminated.');
    const departmentIds = employee.departments.map((row) => row.departmentId);
    const before = buildEmployeeAuthorizationContext({
      legacyRole: employee.role,
      assignments: employee.permissionRoleAssignments,
      departmentIds,
    });
    const current = employee.seatAssignments.find((row) => row.seatId === seatId);
    let afterAssignments = employee.permissionRoleAssignments.map((row) => ({
      role: row.role,
      scopeDepartmentId: row.scopeDepartmentId,
      seatAssignmentId: row.seatAssignmentId,
    }));
    let afterDepartmentIds = departmentIds;
    if (input.operation === 'ASSIGN') {
      if (seat.status !== 'ACTIVE') throw new BadRequestException('Seat is archived.');
      afterDepartmentIds = [...new Set([...departmentIds, seat.departmentId])];
      if (seat.defaultPermissionRole)
        afterAssignments.push({
          role: seat.defaultPermissionRole,
          scopeDepartmentId: seat.departmentId,
          seatAssignmentId: null,
        });
    } else {
      if (!current)
        throw new BadRequestException('Employee has no active assignment on this seat.');
      afterAssignments = afterAssignments.filter((row) => row.seatAssignmentId !== current.id);
      if (
        current.membershipProvisioned &&
        !employee.seatAssignments.some(
          (row) => row.id !== current.id && row.seat.departmentId === seat.departmentId,
        )
      )
        afterDepartmentIds = departmentIds.filter((id) => id !== seat.departmentId);
    }
    const after = buildEmployeeAuthorizationContext({
      legacyRole: employee.role,
      assignments: afterAssignments,
      departmentIds: afterDepartmentIds,
    });
    const keys = [...new Set([...Object.keys(before.grants), ...Object.keys(after.grants)])].sort();
    return {
      before: before.grants,
      after: after.grants,
      changes: keys
        .filter((key) => JSON.stringify(before.grants[key]) !== JSON.stringify(after.grants[key]))
        .map((key) => ({
          permission: key,
          before: before.grants[key] ?? null,
          after: after.grants[key] ?? null,
        })),
    };
  }
}
