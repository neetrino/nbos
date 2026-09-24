import { describe, expect, it } from 'vitest';
import type { OrgSeat } from '@/lib/api/org-seats';
import {
  activeAssignmentForEmployee,
  departmentHasSeats,
  findLeadershipSeat,
} from './org-department-member-actions';

function seat(partial: Partial<OrgSeat> & Pick<OrgSeat, 'id' | 'kind'>): OrgSeat {
  const department = partial.department ?? {
    id: 'dept-1',
    name: 'Sales',
    slug: 'sales',
    headSeatId: null as string | null,
  };
  return {
    id: partial.id,
    departmentId: partial.departmentId ?? 'dept-1',
    title: partial.title ?? partial.id,
    description: null,
    defaultPermissionRoleId: null,
    kind: partial.kind,
    status: partial.status ?? 'ACTIVE',
    sortOrder: 0,
    department,
    defaultPermissionRole: null,
    assignments: partial.assignments ?? [],
  };
}

describe('org-department-member-actions helpers', () => {
  it('detects seats and finds head / deputy targets', () => {
    const seats = [
      seat({
        id: 'head',
        kind: 'HEAD',
        department: { id: 'dept-1', name: 'Sales', slug: 'sales', headSeatId: 'head' },
      }),
      seat({ id: 'deputy', kind: 'DEPUTY' }),
    ];
    expect(departmentHasSeats(seats)).toBe(true);
    expect(findLeadershipSeat(seats, 'HEAD')?.id).toBe('head');
    expect(findLeadershipSeat(seats, 'DEPUTY')?.id).toBe('deputy');
  });

  it('lists active assignments for an employee', () => {
    const seats = [
      seat({
        id: 'head',
        kind: 'HEAD',
        department: { id: 'dept-1', name: 'Sales', slug: 'sales', headSeatId: 'head' },
        assignments: [
          {
            id: 'a1',
            seatId: 'head',
            employeeId: 'e1',
            status: 'ACTIVE',
            allocationPct: 100,
            isPrimary: true,
            startsAt: '2026-01-01',
            endsAt: null,
            employee: {
              id: 'e1',
              firstName: 'A',
              lastName: 'B',
              avatar: null,
              position: null,
              role: { id: 'r', name: 'Role', slug: 'role', level: 1 },
            },
          },
        ],
      }),
    ];
    expect(activeAssignmentForEmployee(seats, 'e1')).toEqual([
      { seat: seats[0], assignmentId: 'a1' },
    ]);
    expect(activeAssignmentForEmployee(seats, 'e2')).toEqual([]);
  });
});
