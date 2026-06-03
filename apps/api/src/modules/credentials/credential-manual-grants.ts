import type { PrismaClient } from '@nbos/database';
import { activeResourceAccessGrantWhere } from './credential-active-grant.where';
import type {
  CredentialManualGrantInput,
  CredentialManualGrantLevel,
  CredentialManualGrantRow,
} from './credential-manual-grant.types';

import { RESOURCE_GRANT_RESOURCE_TYPE } from '@nbos/shared';

const RESOURCE_TYPE_CREDENTIAL = RESOURCE_GRANT_RESOURCE_TYPE.CREDENTIAL;

function parseGrantExpiresAt(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

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
      ...activeResourceAccessGrantWhere(),
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
      ...activeResourceAccessGrantWhere(),
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
    expiresAt: row.expiresAt?.toISOString() ?? null,
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

  const desired = new Map(grants.map((g) => [g.employeeId, g]));
  const toRevoke = active.filter((row) => !desired.has(row.employeeId));
  if (toRevoke.length > 0) {
    await prisma.resourceAccessGrant.updateMany({
      where: { id: { in: toRevoke.map((r) => r.id) } },
      data: { revokedAt: new Date() },
    });
  }

  for (const grant of desired.values()) {
    const expiresAt = parseGrantExpiresAt(grant.expiresAt);
    await prisma.resourceAccessGrant.upsert({
      where: {
        resourceType_resourceId_employeeId: {
          resourceType: RESOURCE_TYPE_CREDENTIAL,
          resourceId: credentialId,
          employeeId: grant.employeeId,
        },
      },
      create: {
        resourceType: RESOURCE_TYPE_CREDENTIAL,
        resourceId: credentialId,
        employeeId: grant.employeeId,
        level: grant.level,
        grantedById,
        expiresAt,
      },
      update: {
        revokedAt: null,
        level: grant.level,
        grantedById,
        expiresAt,
      },
    });
  }
}
