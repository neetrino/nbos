import { PLATFORM_OWNERSHIP_SINGLETON_ID } from '@nbos/shared';
import type { PrismaClient } from '@nbos/database';

/**
 * Seed/publish author: explicit employee, otherwise the platform Owner.
 */
export async function resolveSeedAuthorId(
  prisma: PrismaClient,
  requested: string | null,
): Promise<string> {
  if (requested) {
    const employee = await prisma.employee.findUnique({
      where: { id: requested },
      select: { id: true },
    });
    if (!employee) {
      throw new Error(`Employee ${requested} not found. Pass --author=<employeeId>.`);
    }
    return employee.id;
  }
  const ownership = await prisma.platformOwnership.findUnique({
    where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
    select: { ownerEmployeeId: true },
  });
  if (!ownership) {
    throw new Error('Platform owner is missing. Pass --author=<employeeId>.');
  }
  return ownership.ownerEmployeeId;
}
