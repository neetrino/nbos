import type { Prisma } from '@nbos/database';

/** A seat assignment counts as held while it is not ended, including temporary cover. */
export const ACTIVE_SEAT_ASSIGNMENT_WHERE = {
  status: { in: ['ACTIVE', 'TEMPORARY'] },
  endsAt: null,
} satisfies Prisma.OrgSeatAssignmentWhereInput;

export const ORG_SEAT_EMPLOYEE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
  position: true,
  role: { select: { id: true, name: true, slug: true, level: true } },
} satisfies Prisma.EmployeeSelect;

export const ORG_SEAT_INCLUDE = {
  department: { select: { id: true, name: true, slug: true, headSeatId: true } },
  defaultPermissionRole: {
    select: { id: true, name: true, slug: true, level: true, assignable: true },
  },
  assignments: {
    where: ACTIVE_SEAT_ASSIGNMENT_WHERE,
    include: { employee: { select: ORG_SEAT_EMPLOYEE_SELECT } },
    orderBy: { startsAt: 'asc' },
  },
} satisfies Prisma.OrgSeatInclude;
