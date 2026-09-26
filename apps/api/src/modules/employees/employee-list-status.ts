import type { Prisma } from '@nbos/database';

const EMPLOYEE_LIST_STATUSES = ['ACTIVE', 'PROBATION', 'ON_LEAVE', 'TERMINATED'] as const;

type EmployeeListStatus = (typeof EMPLOYEE_LIST_STATUSES)[number];

function knownStatus(value: string | undefined): EmployeeListStatus | undefined {
  if (!value) return undefined;
  return EMPLOYEE_LIST_STATUSES.find((status) => status === value);
}

/**
 * Exact `status` wins. With no exact status, `excludeStatus` drops that one status
 * (team and salary directories use this to hide terminated people by default).
 */
export function resolveEmployeeListStatusFilter(
  status: string | undefined,
  excludeStatus: string | undefined,
): Prisma.EmployeeWhereInput['status'] | undefined {
  const exact = knownStatus(status);
  if (exact) return exact;
  if (status) return status as Prisma.EmployeeWhereInput['status'];
  const excluded = knownStatus(excludeStatus);
  if (!excluded) return undefined;
  return { not: excluded };
}
