import type { Prisma } from '@nbos/database';

/** Legacy access comes from Employee.roleId during the expand phase. */
export function activeAdditionalRoleAssignments(
  now: Date,
): Prisma.PermissionRoleAssignmentWhereInput {
  return {
    source: { not: 'LEGACY' },
    revokedAt: null,
    effectiveFrom: { lte: now },
    AND: [
      { OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }] },
      {
        OR: [
          { source: 'MANUAL' },
          {
            source: 'SEAT',
            seatAssignment: {
              status: { in: ['ACTIVE', 'TEMPORARY'] },
              startsAt: { lte: now },
              OR: [{ endsAt: null }, { endsAt: { gt: now } }],
              seat: { status: 'ACTIVE' },
              employee: { status: { not: 'TERMINATED' } },
            },
          },
        ],
      },
    ],
  };
}
