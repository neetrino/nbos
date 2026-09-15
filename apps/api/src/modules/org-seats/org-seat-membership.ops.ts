import type { TransactionClient } from '@nbos/database';
import {
  DEPARTMENT_ROLE_MEMBER,
  departmentLeadershipRank,
} from '../departments/department-member.constants';
import { seatDepartmentRole } from '../departments/department-seat-leadership';

export interface SeatMembershipContext {
  id: string;
  departmentId: string;
  kind: string;
  department: { headSeatId: string | null };
}

export interface SeatMembershipAssignment {
  employeeId: string;
  isPrimary: boolean;
  membershipProvisioned: boolean;
  previousPrimaryDepartmentId: string | null;
  seat: { departmentId: string };
}

export interface OpenSeatProjection {
  id: string;
  isPrimary: boolean;
  seat: {
    id: string;
    kind: string;
    department: { headSeatId: string | null };
  };
}

export async function ensureSeatDepartmentMembership(
  tx: TransactionClient,
  seat: SeatMembershipContext,
  input: { employeeId: string; isPrimary?: boolean },
): Promise<{ provisioned: boolean; previousPrimaryDepartmentId: string | null }> {
  const membershipKey = { employeeId: input.employeeId, departmentId: seat.departmentId };
  const [membership, previousPrimary, alreadyHeld] = await Promise.all([
    tx.employeeDepartment.findUnique({
      where: { employeeId_departmentId: membershipKey },
      select: { id: true },
    }),
    input.isPrimary
      ? tx.employeeDepartment.findFirst({
          where: { employeeId: input.employeeId, isPrimary: true },
          select: { departmentId: true },
        })
      : null,
    openSeatAssignmentsInDepartment(tx, input.employeeId, seat.departmentId),
  ]);
  // One employee may hold several seats in a department, so a new standard seat must not
  // demote someone who also holds the head seat.
  const deptRole = departmentRoleForRemainingSeats([...alreadyHeld, { seat }]);
  if (input.isPrimary) await clearPrimaryAssignment(tx, input.employeeId);
  await tx.employeeDepartment.upsert({
    where: { employeeId_departmentId: membershipKey },
    create: { ...membershipKey, deptRole, isPrimary: input.isPrimary ?? false },
    // A membership that predates seats carries its own `deptRole`, which then contradicts the
    // seats now backing it. Seats are the only source of leadership, so they win here too.
    update: { deptRole, ...(input.isPrimary ? { isPrimary: true } : {}) },
  });
  const previousDepartmentId = previousPrimary?.departmentId ?? null;
  return {
    provisioned: membership === null,
    previousPrimaryDepartmentId: previousDepartmentId,
  };
}

export async function reconcileSeatDepartmentMembership(
  tx: TransactionClient,
  assignment: SeatMembershipAssignment,
): Promise<void> {
  const remaining = await openSeatAssignmentsInDepartment(
    tx,
    assignment.employeeId,
    assignment.seat.departmentId,
  );
  if (assignment.membershipProvisioned) {
    // B -> C primary handovers must still restore A when B is ended before C.
    await tx.orgSeatAssignment.updateMany({
      where: {
        employeeId: assignment.employeeId,
        status: { in: ['ACTIVE', 'TEMPORARY'] },
        endsAt: null,
        previousPrimaryDepartmentId: assignment.seat.departmentId,
      },
      data: { previousPrimaryDepartmentId: assignment.previousPrimaryDepartmentId },
    });
  }
  // Transfer cleanup responsibility when the creating seat ends first.
  if (assignment.membershipProvisioned && remaining[0]) {
    await tx.orgSeatAssignment.update({
      where: { id: remaining[0].id },
      data: { membershipProvisioned: true },
    });
  }
  if (assignment.membershipProvisioned && remaining.length === 0) {
    await tx.employeeDepartment.deleteMany({
      where: {
        employeeId: assignment.employeeId,
        departmentId: assignment.seat.departmentId,
      },
    });
  } else {
    await tx.employeeDepartment.updateMany({
      where: {
        employeeId: assignment.employeeId,
        departmentId: assignment.seat.departmentId,
      },
      data: {
        // Ending the head seat must not leave the membership claiming leadership.
        deptRole: departmentRoleForRemainingSeats(remaining),
        ...(assignment.isPrimary && !remaining.some((item) => item.isPrimary)
          ? { isPrimary: false }
          : {}),
      },
    });
  }
  await restorePreviousPrimary(tx, assignment);
}

async function clearPrimaryAssignment(tx: TransactionClient, employeeId: string): Promise<void> {
  await tx.employeeDepartment.updateMany({
    where: { employeeId, isPrimary: true },
    data: { isPrimary: false },
  });
  await tx.orgSeatAssignment.updateMany({
    where: {
      employeeId,
      isPrimary: true,
      status: { in: ['ACTIVE', 'TEMPORARY'] },
      endsAt: null,
    },
    data: { isPrimary: false },
  });
}

function openSeatAssignmentsInDepartment(
  tx: TransactionClient,
  employeeId: string,
  departmentId: string,
): Promise<OpenSeatProjection[]> {
  return tx.orgSeatAssignment.findMany({
    where: {
      employeeId,
      status: { in: ['ACTIVE', 'TEMPORARY'] },
      endsAt: null,
      seat: { departmentId },
    },
    select: {
      id: true,
      isPrimary: true,
      seat: {
        select: {
          id: true,
          kind: true,
          department: { select: { headSeatId: true } },
        },
      },
    },
  });
}

async function restorePreviousPrimary(
  tx: TransactionClient,
  assignment: SeatMembershipAssignment,
): Promise<void> {
  if (!assignment.isPrimary || !assignment.previousPrimaryDepartmentId) return;
  const currentPrimary = await tx.employeeDepartment.findFirst({
    where: { employeeId: assignment.employeeId, isPrimary: true },
    select: { id: true },
  });
  if (currentPrimary) return;
  const restored = await tx.employeeDepartment.updateMany({
    where: {
      employeeId: assignment.employeeId,
      departmentId: assignment.previousPrimaryDepartmentId,
    },
    data: { isPrimary: true },
  });
  if (restored.count === 0) return;
  const previousSeat = await tx.orgSeatAssignment.findFirst({
    where: {
      employeeId: assignment.employeeId,
      status: { in: ['ACTIVE', 'TEMPORARY'] },
      endsAt: null,
      seat: { departmentId: assignment.previousPrimaryDepartmentId },
    },
    select: { id: true },
    orderBy: { startsAt: 'asc' },
  });
  if (!previousSeat) return;
  await tx.orgSeatAssignment.update({
    where: { id: previousSeat.id },
    data: { isPrimary: true },
  });
}

/**
 * Highest-ranking role among the seats the employee still holds in the department.
 * No seat left means plain membership, never leadership.
 */
export function departmentRoleForRemainingSeats(
  remaining: readonly Pick<OpenSeatProjection, 'seat'>[],
): string {
  let role = DEPARTMENT_ROLE_MEMBER;
  for (const item of remaining) {
    const candidate = seatDepartmentRole(item.seat);
    if (departmentLeadershipRank(candidate) < departmentLeadershipRank(role)) role = candidate;
  }
  return role;
}
