import {
  DEPARTMENT_ROLE_DEPUTY,
  DEPARTMENT_ROLE_HEAD,
  DEPARTMENT_ROLE_MEMBER,
  DEPARTMENT_LEADERSHIP_ROLES,
  departmentLeadershipRank,
} from './department-member.constants';

/** Active seat of one department, projected for leadership derivation. */
export interface SeatLeadershipSeat {
  id: string;
  departmentId: string;
  kind: string;
  department: { headSeatId: string | null };
  assignments: ReadonlyArray<{ employeeId: string }>;
}

/** Derived `deptRole` per employee, for departments that have at least one seat. */
export type SeatLeadershipIndex = ReadonlyMap<string, ReadonlyMap<string, string>>;

/**
 * `Department.headSeatId` plus the seat's active assignment is the only source of
 * department leadership. `EmployeeDepartment.deptRole` stays a legacy display field
 * and is only trusted for departments that have no seats yet.
 */
export function buildSeatLeadershipIndex(
  seats: readonly SeatLeadershipSeat[],
): SeatLeadershipIndex {
  const index = new Map<string, Map<string, string>>();
  for (const seat of seats) {
    const byEmployee = index.get(seat.departmentId) ?? new Map<string, string>();
    index.set(seat.departmentId, byEmployee);
    const role = seatDepartmentRole(seat);
    for (const assignment of seat.assignments) {
      const current = byEmployee.get(assignment.employeeId);
      if (current && departmentLeadershipRank(current) <= departmentLeadershipRank(role)) continue;
      byEmployee.set(assignment.employeeId, role);
    }
  }
  return index;
}

export function seatDepartmentRole(
  seat: Pick<SeatLeadershipSeat, 'id' | 'kind' | 'department'>,
): string {
  if (seat.department.headSeatId === seat.id) return DEPARTMENT_ROLE_HEAD;
  if (seat.kind === DEPARTMENT_ROLE_DEPUTY) return DEPARTMENT_ROLE_DEPUTY;
  return DEPARTMENT_ROLE_MEMBER;
}

/** Rewrites `deptRole` from seats. Departments without seats keep the legacy value. */
export function applySeatLeadership<T extends { employeeId: string; deptRole: string }>(
  members: readonly T[],
  derived: ReadonlyMap<string, string> | undefined,
): T[] {
  if (!derived) return [...members];
  return members.map((member) => ({
    ...member,
    deptRole: derived.get(member.employeeId) ?? DEPARTMENT_ROLE_MEMBER,
  }));
}

export function isDepartmentLeadershipRole(deptRole: string): boolean {
  return (DEPARTMENT_LEADERSHIP_ROLES as readonly string[]).includes(deptRole);
}
