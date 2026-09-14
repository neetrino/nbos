import { describe, expect, it } from 'vitest';
import type { DepartmentItem } from '@/lib/api/employees';
import type { OrgSeat } from '@/lib/api/org-seats';
import { overlayOrgSeats } from './org-chart-seats';

describe('org chart seat overlay', () => {
  it('uses explicit seat kind and title instead of permission-role heuristics', () => {
    const department = departmentFixture();
    const result = overlayOrgSeats([department], [seatFixture()]);

    expect(result[0]?.members?.[0]).toMatchObject({
      employeeId: 'employee-1',
      deptRole: 'HEAD',
      employee: { position: 'Head of Sales' },
    });
  });

  it('keeps legacy previews for departments without explicit seats', () => {
    const department = departmentFixture();
    expect(overlayOrgSeats([department], [])[0]).toBe(department);
  });

  it('keeps the legacy deptRole of a seat-less department that still has members', () => {
    const department = { ...departmentFixture(), members: [memberFixture('HEAD')] };
    expect(overlayOrgSeats([department], [])[0]).toBe(department);
  });

  it('keeps seat-less members and the server headcount when seats exist', () => {
    const department = {
      ...departmentFixture(),
      _count: { members: 2 },
      members: [memberFixture('MEMBER')],
    };

    const result = overlayOrgSeats([department], [seatFixture()])[0];

    expect(result?.members?.map((member) => member.employeeId)).toEqual([
      'employee-1',
      'employee-2',
    ]);
    expect(result?._count).toEqual({ members: 2 });
  });

  it('does not throw when a seat has no nested department', () => {
    const seat = { ...seatFixture(), department: undefined as never };
    expect(() => overlayOrgSeats([departmentFixture()], [seat])).not.toThrow();
  });
});

function departmentFixture(): DepartmentItem {
  return {
    id: 'department-1',
    name: 'Sales',
    slug: 'sales',
    description: null,
    parentId: null,
    sortOrder: 0,
  };
}

function memberFixture(deptRole: string) {
  return {
    id: 'membership-2',
    employeeId: 'employee-2',
    departmentId: 'department-1',
    deptRole,
    isPrimary: false,
    employee: {
      id: 'employee-2',
      firstName: 'Seatless',
      lastName: 'Member',
      avatar: null,
      position: null,
    },
  };
}

function seatFixture(): OrgSeat {
  return {
    id: 'seat-1',
    departmentId: 'department-1',
    title: 'Head of Sales',
    description: null,
    defaultPermissionRoleId: 'role-1',
    kind: 'HEAD',
    status: 'ACTIVE',
    sortOrder: 0,
    department: {
      id: 'department-1',
      name: 'Sales',
      slug: 'sales',
      headSeatId: 'seat-1',
    },
    defaultPermissionRole: {
      id: 'role-1',
      name: 'Head of Sales',
      slug: 'head-of-sales',
      level: 3,
      assignable: true,
    },
    assignments: [
      {
        id: 'assignment-1',
        seatId: 'seat-1',
        employeeId: 'employee-1',
        status: 'ACTIVE',
        allocationPct: 100,
        isPrimary: true,
        startsAt: '2026-09-14T00:00:00.000Z',
        endsAt: null,
        employee: {
          id: 'employee-1',
          firstName: 'Jasmin',
          lastName: 'Test',
          avatar: null,
          position: 'CEO',
          role: { id: 'role-1', name: 'CEO', slug: 'ceo', level: 2 },
        },
      },
    ],
  };
}
