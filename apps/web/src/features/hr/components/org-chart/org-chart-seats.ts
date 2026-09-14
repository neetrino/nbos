import type { DepartmentItem, DepartmentMember } from '@/lib/api/employees';
import type { OrgSeat } from '@/lib/api/org-seats';
import {
  ORG_DEPT_ROLE_DEPUTY,
  ORG_DEPT_ROLE_HEAD,
  ORG_DEPT_ROLE_MEMBER,
} from './org-chart-constants';

export function overlayOrgSeats(
  departments: readonly DepartmentItem[],
  seats: readonly OrgSeat[],
): DepartmentItem[] {
  if (!Array.isArray(seats)) return [...departments];
  const seatsByDepartment = new Map<string, OrgSeat[]>();
  for (const seat of seats) {
    const departmentSeats = seatsByDepartment.get(seat.departmentId) ?? [];
    departmentSeats.push(seat);
    seatsByDepartment.set(seat.departmentId, departmentSeats);
  }
  return departments.map((department) => {
    const departmentSeats = seatsByDepartment.get(department.id);
    // Departments without seats keep their legacy deptRole, same as the API read model.
    if (!departmentSeats?.length) return department;
    const seatDerivedMembers = uniqueSeatMembers(departmentSeats.flatMap(seatMembers));
    const assignedEmployeeIds = new Set(seatDerivedMembers.map((member) => member.employeeId));
    const membershipOnly = (department.members ?? [])
      .filter((member) => !assignedEmployeeIds.has(member.employeeId))
      .map((member) => ({ ...member, deptRole: ORG_DEPT_ROLE_MEMBER }));
    return {
      ...department,
      members: [...seatDerivedMembers, ...membershipOnly],
      _count: department._count,
    };
  });
}

function seatMembers(seat: OrgSeat): DepartmentMember[] {
  return (seat.assignments ?? []).flatMap((assignment) => {
    if (!assignment.employee) return [];
    return [
      {
        id: assignment.id,
        employeeId: assignment.employeeId,
        departmentId: seat.departmentId,
        deptRole: departmentRoleForSeat(seat),
        isPrimary: assignment.isPrimary,
        employee: {
          ...assignment.employee,
          position: seat.title,
        },
      },
    ];
  });
}

function uniqueSeatMembers(members: DepartmentMember[]): DepartmentMember[] {
  const byEmployee = new Map<string, DepartmentMember>();
  for (const member of members) {
    const current = byEmployee.get(member.employeeId);
    if (!current || departmentRoleRank(member.deptRole) < departmentRoleRank(current.deptRole)) {
      byEmployee.set(member.employeeId, member);
    }
  }
  return [...byEmployee.values()];
}

function departmentRoleRank(role: string): number {
  if (role === ORG_DEPT_ROLE_HEAD) return 0;
  if (role === ORG_DEPT_ROLE_DEPUTY) return 1;
  return 2;
}

function departmentRoleForSeat(seat: Pick<OrgSeat, 'id' | 'kind' | 'department'>): string {
  if (seat.department?.headSeatId === seat.id) return ORG_DEPT_ROLE_HEAD;
  if (seat.kind === 'DEPUTY') return ORG_DEPT_ROLE_DEPUTY;
  return ORG_DEPT_ROLE_MEMBER;
}
