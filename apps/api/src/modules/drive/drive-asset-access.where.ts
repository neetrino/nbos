import type { Prisma, PrismaClient } from '@nbos/database';
import type { DriveEntityAccess } from './drive-access.types';

const DRIVE_WIDE_SCOPES = new Set<string>(['ALL']);

/** “Shared with me”: not sole self-origin, or explicit grant to the viewer. */
export function buildSharedWithMeWhereClause(employeeId: string): Prisma.FileAssetWhereInput {
  const notSoleSelfOrigin: Prisma.FileAssetWhereInput = {
    NOT: {
      OR: [{ ownerId: employeeId }, { AND: [{ ownerId: null }, { createdById: employeeId }] }],
    },
  };
  const activeGrant: Prisma.FileAssetWhereInput = {
    assetGrants: {
      some: {
        granteeEmployeeId: employeeId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
  };
  return { OR: [notSoleSelfOrigin, activeGrant] };
}

function activeFileAssetGrantWhere(employeeId: string): Prisma.FileAssetWhereInput {
  return {
    assetGrants: {
      some: {
        granteeEmployeeId: employeeId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    },
  };
}

function normalizeScope(scope: string | undefined): string {
  return scope?.trim().toUpperCase() ?? 'NONE';
}

export async function buildDriveAssetAccessWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access?: DriveEntityAccess,
): Promise<Prisma.FileAssetWhereInput> {
  if (!access) return {};
  const scope = normalizeScope(access.driveScope);
  if (DRIVE_WIDE_SCOPES.has(scope)) return {};
  const grantWhere = activeFileAssetGrantWhere(access.employeeId);
  if (scope === 'OWN') {
    return {
      OR: [{ ownerId: access.employeeId }, { createdById: access.employeeId }, grantWhere],
    };
  }
  if (scope === 'DEPARTMENT') {
    const colleagueRows = await prisma.employeeDepartment.findMany({
      where: { departmentId: { in: access.departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    const colleagueIds = colleagueRows.map((row) => row.employeeId);
    return {
      OR: [
        { ownerId: { in: colleagueIds } },
        { createdById: { in: colleagueIds } },
        { ownerId: access.employeeId },
        { createdById: access.employeeId },
        grantWhere,
      ],
    };
  }
  return grantWhere;
}
