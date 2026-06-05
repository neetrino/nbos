import type { PrismaClient } from '@nbos/database';
import type { DriveEntityContextAccess } from './drive-access.types';

const SCOPE_DEPARTMENT = 'DEPARTMENT';

function normalizeDriveScope(scope: string | undefined): string {
  return scope?.trim().toUpperCase() ?? 'NONE';
}

/** Employee ids used for Drive OWN/DEPARTMENT participation checks. */
export async function loadDriveScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: DriveEntityContextAccess,
): Promise<string[]> {
  const ids = new Set<string>([access.employeeId]);
  if (
    normalizeDriveScope(access.driveScope) !== SCOPE_DEPARTMENT ||
    access.departmentIds.length === 0
  ) {
    return [...ids];
  }
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: access.departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) ids.add(row.employeeId);
  return [...ids];
}

export function driveScopeBypassesParticipation(driveScope: string | undefined): boolean {
  return normalizeDriveScope(driveScope) === 'ALL';
}
