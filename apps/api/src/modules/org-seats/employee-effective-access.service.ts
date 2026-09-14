import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildEmployeeAuthorizationContext } from '../../common/authorization/employee-authorization-context';
import { activeAdditionalRoleAssignments } from '../../common/authorization/active-role-assignments';

const ROLE_AUTHORIZATION_INCLUDE = {
  permissions: {
    include: { permission: true },
  },
} satisfies Prisma.RoleInclude;

@Injectable()
export class EmployeeEffectiveAccessService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async get(employeeId: string) {
    const now = new Date();
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        departments: {
          select: { departmentId: true },
          orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
        },
        role: { include: ROLE_AUTHORIZATION_INCLUDE },
        permissionRoleAssignments: {
          where: activeAdditionalRoleAssignments(now),
          include: {
            role: { include: ROLE_AUTHORIZATION_INCLUDE },
            scopeDepartment: { select: { id: true, name: true } },
            seatAssignment: {
              select: {
                id: true,
                seat: { select: { id: true, title: true, departmentId: true, kind: true } },
              },
            },
          },
          orderBy: { effectiveFrom: 'asc' },
        },
        seatAssignments: {
          where: { status: { in: ['ACTIVE', 'TEMPORARY'] }, endsAt: null },
          select: {
            id: true,
            status: true,
            allocationPct: true,
            isPrimary: true,
            seat: {
              select: {
                id: true,
                title: true,
                kind: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!employee) throw new NotFoundException(`Employee ${employeeId} not found`);
    const authorization = buildEmployeeAuthorizationContext({
      legacyRole: employee.role,
      assignments: employee.permissionRoleAssignments,
      departmentIds: employee.departments.map((item) => item.departmentId),
    });
    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
      roles:
        employee.status === 'TERMINATED'
          ? []
          : [
              roleAssignmentView({
                id: employee.id,
                source: 'LEGACY',
                role: employee.role,
                scopeDepartment: null,
                seatAssignment: null,
              }),
              ...employee.permissionRoleAssignments.map(roleAssignmentView),
            ],
      seats: employee.status === 'TERMINATED' ? [] : employee.seatAssignments,
      effectivePermissions: employee.status === 'TERMINATED' ? {} : authorization.permissions,
      effectivePermissionGrants: employee.status === 'TERMINATED' ? {} : authorization.grants,
    };
  }
}

function roleAssignmentView(assignment: {
  id: string;
  source: string;
  scopeDepartment: { id: string; name: string } | null;
  role: { id: string; name: string; slug: string; level: number };
  seatAssignment: {
    id: string;
    seat: { id: string; title: string; departmentId: string; kind: string };
  } | null;
}) {
  return {
    id: assignment.id,
    source: assignment.source,
    role: {
      id: assignment.role.id,
      name: assignment.role.name,
      slug: assignment.role.slug,
      level: assignment.role.level,
    },
    scopeDepartment: assignment.scopeDepartment,
    seatAssignment: assignment.seatAssignment,
  };
}
