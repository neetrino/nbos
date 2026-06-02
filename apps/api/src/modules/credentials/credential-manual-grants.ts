import type { PrismaClient } from '@nbos/database';

const RESOURCE_TYPE_CREDENTIAL = 'credential';

/** Active manual grant credential ids for an employee. */
export async function loadManualGrantCredentialIds(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<string[]> {
  const rows = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: RESOURCE_TYPE_CREDENTIAL,
      employeeId,
      revokedAt: null,
    },
    select: { resourceId: true },
  });
  return rows.map((r) => r.resourceId);
}

/** Sync ResourceAccessGrant rows from legacy `allowedEmployees` (SECRET credentials). */
export async function syncCredentialManualGrants(
  prisma: InstanceType<typeof PrismaClient>,
  credentialId: string,
  employeeIds: string[],
  grantedById: string,
): Promise<void> {
  const active = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: RESOURCE_TYPE_CREDENTIAL,
      resourceId: credentialId,
      revokedAt: null,
    },
    select: { id: true, employeeId: true },
  });

  const desired = new Set(employeeIds);
  const toRevoke = active.filter((row) => !desired.has(row.employeeId));
  if (toRevoke.length > 0) {
    await prisma.resourceAccessGrant.updateMany({
      where: { id: { in: toRevoke.map((r) => r.id) } },
      data: { revokedAt: new Date() },
    });
  }

  for (const employeeId of employeeIds) {
    await prisma.resourceAccessGrant.upsert({
      where: {
        resourceType_resourceId_employeeId: {
          resourceType: RESOURCE_TYPE_CREDENTIAL,
          resourceId: credentialId,
          employeeId,
        },
      },
      create: {
        resourceType: RESOURCE_TYPE_CREDENTIAL,
        resourceId: credentialId,
        employeeId,
        level: 'VIEW',
        grantedById,
      },
      update: {
        revokedAt: null,
        level: 'VIEW',
        grantedById,
      },
    });
  }
}
