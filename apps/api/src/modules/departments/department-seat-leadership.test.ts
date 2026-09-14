import { describe, expect, it } from 'vitest';
import {
  applySeatLeadership,
  buildSeatLeadershipIndex,
  type SeatLeadershipSeat,
} from './department-seat-leadership';

const DEPARTMENT = 'department-1';

describe('department seat leadership', () => {
  it('promotes the head seat holder even when the membership row says MEMBER', () => {
    const index = buildSeatLeadershipIndex([seat('seat-1', 'HEAD', ['employee-1'], 'seat-1')]);

    const members = applySeatLeadership([member('employee-1', 'MEMBER')], index.get(DEPARTMENT));

    expect(members).toEqual([member('employee-1', 'HEAD')]);
  });

  it('demotes a stale HEAD membership once the head seat is vacant', () => {
    const index = buildSeatLeadershipIndex([seat('seat-2', 'STANDARD', ['employee-1'], null)]);

    const members = applySeatLeadership([member('employee-1', 'HEAD')], index.get(DEPARTMENT));

    expect(members).toEqual([member('employee-1', 'MEMBER')]);
  });

  it('derives DEPUTY from the seat kind, not from the membership row', () => {
    const index = buildSeatLeadershipIndex([seat('seat-3', 'DEPUTY', ['employee-2'], 'seat-1')]);

    const members = applySeatLeadership([member('employee-2', 'MEMBER')], index.get(DEPARTMENT));

    expect(members[0]?.deptRole).toBe('DEPUTY');
  });

  it('keeps the strongest role when one employee holds several seats', () => {
    const index = buildSeatLeadershipIndex([
      seat('seat-4', 'DEPUTY', ['employee-3'], 'seat-5'),
      seat('seat-5', 'STANDARD', ['employee-3'], 'seat-5'),
    ]);

    expect(index.get(DEPARTMENT)?.get('employee-3')).toBe('HEAD');
  });

  it('leaves the legacy deptRole untouched for a department without seats', () => {
    const index = buildSeatLeadershipIndex([]);

    const members = applySeatLeadership([member('employee-4', 'HEAD')], index.get(DEPARTMENT));

    expect(members).toEqual([member('employee-4', 'HEAD')]);
  });
});

function seat(
  id: string,
  kind: string,
  employeeIds: string[],
  headSeatId: string | null,
): SeatLeadershipSeat {
  return {
    id,
    departmentId: DEPARTMENT,
    kind,
    department: { headSeatId },
    assignments: employeeIds.map((employeeId) => ({ employeeId })),
  };
}

function member(employeeId: string, deptRole: string) {
  return { employeeId, deptRole };
}
