import type { Prisma, PrismaClient } from '@nbos/database';
import type { FileGrantPermission } from './drive-grant-permissions';
import type { DriveEntityAccess } from './drive-access.types';

const DRIVE_WIDE_SCOPES = new Set<string>(['ALL']);
const SELF_ONLY_VISIBILITIES = new Set<string>(['PERSONAL', 'RESTRICTED']);
const SENSITIVE_CONFIDENTIALITIES = new Set<string>([
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
]);

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

function activeFileAssetGrantWhere(
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Prisma.FileAssetWhereInput {
  return {
    assetGrants: {
      some: {
        granteeEmployeeId: employeeId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        ...(permissions && permissions.length > 0 ? { permission: { in: [...permissions] } } : {}),
      },
    },
  };
}

function selfOriginWhere(employeeId: string): Prisma.FileAssetWhereInput {
  return {
    OR: [{ ownerId: employeeId }, { createdById: employeeId }],
  };
}

function layeredSensitivityWhere(employeeId: string): Prisma.FileAssetWhereInput {
  return {
    OR: [
      {
        AND: [
          { visibility: { notIn: [...SELF_ONLY_VISIBILITIES] as never[] } },
          { confidentiality: { notIn: [...SENSITIVE_CONFIDENTIALITIES] as never[] } },
        ],
      },
      selfOriginWhere(employeeId),
      activeFileAssetGrantWhere(employeeId),
    ],
  };
}

function ownScopeWhere(employeeId: string): Prisma.FileAssetWhereInput {
  return {
    OR: [
      { ownerId: employeeId },
      { createdById: employeeId },
      activeFileAssetGrantWhere(employeeId),
    ],
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
  if (DRIVE_WIDE_SCOPES.has(scope)) {
    return layeredSensitivityWhere(access.employeeId);
  }
  const grantWhere = activeFileAssetGrantWhere(access.employeeId);
  if (scope === 'OWN') {
    return ownScopeWhere(access.employeeId);
  }
  if (scope === 'DEPARTMENT') {
    const colleagueRows = await prisma.employeeDepartment.findMany({
      where: { departmentId: { in: access.departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    const colleagueIds = colleagueRows.map((row) => row.employeeId);
    return {
      AND: [
        {
          OR: [
            { ownerId: { in: colleagueIds } },
            { createdById: { in: colleagueIds } },
            { ownerId: access.employeeId },
            { createdById: access.employeeId },
            grantWhere,
          ],
        },
        layeredSensitivityWhere(access.employeeId),
      ],
    };
  }
  return ownScopeWhere(access.employeeId);
}

export async function buildDriveAssetBaseAccessWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access?: DriveEntityAccess,
): Promise<Prisma.FileAssetWhereInput> {
  if (!access) return {};
  const scope = normalizeScope(access.driveScope);
  if (DRIVE_WIDE_SCOPES.has(scope)) {
    return {
      OR: [
        {
          AND: [
            { visibility: { notIn: [...SELF_ONLY_VISIBILITIES] as never[] } },
            { confidentiality: { notIn: [...SENSITIVE_CONFIDENTIALITIES] as never[] } },
          ],
        },
        selfOriginWhere(access.employeeId),
      ],
    };
  }
  if (scope === 'OWN') {
    return selfOriginWhere(access.employeeId);
  }
  if (scope === 'DEPARTMENT') {
    const colleagueRows = await prisma.employeeDepartment.findMany({
      where: { departmentId: { in: access.departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    const colleagueIds = colleagueRows.map((row) => row.employeeId);
    return {
      AND: [
        {
          OR: [
            { ownerId: { in: colleagueIds } },
            { createdById: { in: colleagueIds } },
            { ownerId: access.employeeId },
            { createdById: access.employeeId },
          ],
        },
        {
          OR: [
            {
              AND: [
                { visibility: { notIn: [...SELF_ONLY_VISIBILITIES] as never[] } },
                { confidentiality: { notIn: [...SENSITIVE_CONFIDENTIALITIES] as never[] } },
              ],
            },
            selfOriginWhere(access.employeeId),
          ],
        },
      ],
    };
  }
  return selfOriginWhere(access.employeeId);
}

export function buildDriveAssetGrantAccessWhere(
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Prisma.FileAssetWhereInput {
  return activeFileAssetGrantWhere(employeeId, permissions);
}
