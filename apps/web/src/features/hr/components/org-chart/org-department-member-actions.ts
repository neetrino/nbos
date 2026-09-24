import { employeesApi } from '@/lib/api/employees';
import { orgSeatsApi, type OrgSeat } from '@/lib/api/org-seats';
import {
  ORG_DEPT_ROLE_DEPUTY,
  ORG_DEPT_ROLE_HEAD,
  ORG_DEPT_ROLE_MEMBER,
} from './org-chart-constants';

export type OrgDrawerLeadershipRole = typeof ORG_DEPT_ROLE_HEAD | typeof ORG_DEPT_ROLE_DEPUTY;
export type OrgDrawerMemberRole = OrgDrawerLeadershipRole | typeof ORG_DEPT_ROLE_MEMBER;

export function departmentHasSeats(seats: readonly OrgSeat[]): boolean {
  return seats.some((seat) => seat.status === 'ACTIVE');
}

export function findLeadershipSeat(
  seats: readonly OrgSeat[],
  role: OrgDrawerLeadershipRole,
): OrgSeat | null {
  const active = seats.filter((seat) => seat.status === 'ACTIVE');
  if (role === ORG_DEPT_ROLE_HEAD) {
    return (
      active.find((seat) => seat.department.headSeatId === seat.id) ??
      active.find((seat) => seat.kind === 'HEAD') ??
      null
    );
  }
  return active.find((seat) => seat.kind === 'DEPUTY') ?? null;
}

export function activeAssignmentForEmployee(
  seats: readonly OrgSeat[],
  employeeId: string,
): Array<{ seat: OrgSeat; assignmentId: string }> {
  const matches: Array<{ seat: OrgSeat; assignmentId: string }> = [];
  for (const seat of seats) {
    if (seat.status !== 'ACTIVE') continue;
    for (const assignment of seat.assignments) {
      if (assignment.employeeId === employeeId && !assignment.endsAt) {
        matches.push({ seat, assignmentId: assignment.id });
      }
    }
  }
  return matches;
}

export async function applyDepartmentMemberRole(params: {
  employeeId: string;
  departmentId: string;
  role: OrgDrawerMemberRole;
  seats: readonly OrgSeat[];
}): Promise<void> {
  const { employeeId, departmentId, role, seats } = params;
  if (!departmentHasSeats(seats)) {
    await employeesApi.updateDepartment(employeeId, departmentId, { deptRole: role });
    return;
  }
  if (role === ORG_DEPT_ROLE_MEMBER) {
    await endLeadershipSeatsForEmployee(seats, employeeId);
    return;
  }
  await assignEmployeeToLeadershipSeat(seats, employeeId, role);
}

export async function removeEmployeeFromDepartment(params: {
  employeeId: string;
  departmentId: string;
  seats: readonly OrgSeat[];
}): Promise<void> {
  const held = activeAssignmentForEmployee(params.seats, params.employeeId);
  for (const item of held) {
    await orgSeatsApi.endAssignment(item.assignmentId, 'Removed from department');
  }
  await employeesApi.removeDepartment(params.employeeId, params.departmentId);
}

export async function transferEmployeeToDepartment(params: {
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  seats: readonly OrgSeat[];
}): Promise<void> {
  await removeEmployeeFromDepartment({
    employeeId: params.employeeId,
    departmentId: params.fromDepartmentId,
    seats: params.seats,
  });
  await employeesApi.addDepartment(params.employeeId, {
    departmentId: params.toDepartmentId,
    deptRole: ORG_DEPT_ROLE_MEMBER,
  });
}

async function endLeadershipSeatsForEmployee(
  seats: readonly OrgSeat[],
  employeeId: string,
): Promise<void> {
  const held = activeAssignmentForEmployee(seats, employeeId).filter(({ seat }) =>
    isLeadershipSeat(seat),
  );
  for (const item of held) {
    await orgSeatsApi.endAssignment(item.assignmentId, 'Demoted to member');
  }
}

async function assignEmployeeToLeadershipSeat(
  seats: readonly OrgSeat[],
  employeeId: string,
  role: OrgDrawerLeadershipRole,
): Promise<void> {
  const seat = findLeadershipSeat(seats, role);
  if (!seat) {
    throw new Error('LEADERSHIP_SEAT_MISSING');
  }
  const current = seat.assignments.find((assignment) => !assignment.endsAt) ?? null;
  if (current?.employeeId === employeeId) return;
  if (current) {
    await orgSeatsApi.endAssignment(current.id, 'Replaced by department drawer assignment');
  }
  await endLeadershipSeatsForEmployee(seats, employeeId);
  await orgSeatsApi.assign(seat.id, { employeeId });
}

function isLeadershipSeat(seat: OrgSeat): boolean {
  if (seat.department.headSeatId === seat.id) return true;
  return seat.kind === 'HEAD' || seat.kind === 'DEPUTY';
}
