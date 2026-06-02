import type { PrismaClient } from '@nbos/database';
import type {
  CredentialManualGrantInput,
  CredentialManualGrantLevel,
  CredentialManualGrantRow,
} from './credential-manual-grant.types';

const RESOURCE_TYPE_CREDENTIAL = 'credential';

export function manualGrantsFromEmployeeIds(
  employeeIds: string[],
  level: CredentialManualGrantLevel = 'VIEW',
): CredentialManualGrantInput[] {
  return employeeIds.map((employeeId) => ({ employeeId, level }));
}

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

export async function loadCredentialManualGrants(
  prisma: InstanceType<typeof PrismaClient>,
  credentialId: string,
): Promise<CredentialManualGrantRow[]> {
  const rows = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: RESOURCE_TYPE_CREDENTIAL,
      resourceId: credentialId,
      revokedAt: null,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      grantedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return rows.map((row) => ({
    employeeId: row.employeeId,
    level: row.level as CredentialManualGrantLevel,
    employee: row.employee,
    grantedAt: row.createdAt.toISOString(),
    grantedBy: row.grantedBy,
  }));
}

/** Sync manual ResourceAccessGrant rows for a credential (revokes removed, upserts desired). */
export async function syncCredentialManualGrants(
  prisma: InstanceType<typeof PrismaClient>,
  credentialId: string,
  grants: CredentialManualGrantInput[],
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

  const desired = new Map(grants.map((g) => [g.employeeId, g.level]));
  const toRevoke = active.filter((row) => !desired.has(row.employeeId));
  if (toRevoke.length > 0) {
    await prisma.resourceAccessGrant.updateMany({
      where: { id: { in: toRevoke.map((r) => r.id) } },
      data: { revokedAt: new Date() },
    });
  }

  for (const [employeeId, level] of desired) {
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
        level,
        grantedById,
      },
      update: {
        revokedAt: null,
        level,
        grantedById,
      },
    });
  }
}
