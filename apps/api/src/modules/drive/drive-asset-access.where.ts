import type { Prisma, PrismaClient } from '@nbos/database';
import type { FileGrantPermission } from './drive-grant-permissions';
import type { DriveEntityAccess } from './drive-access.types';
import { buildDriveExplicitFileGrantWhere } from './drive-resource-access-grant.sync';
import { buildDriveInheritedLinkFileAccessWhere } from './drive-inherited-link-access';

const DRIVE_WIDE_SCOPES = new Set<string>(['ALL']);
const SELF_ONLY_VISIBILITIES = new Set<string>(['PERSONAL', 'RESTRICTED']);
const SENSITIVE_CONFIDENTIALITIES = new Set<string>([
  'FINANCE_SENSITIVE',
  'LEGAL_SENSITIVE',
  'SECRET_ADJACENT',
]);

/** “Shared with me”: not sole self-origin, or explicit grant to the viewer. */
export async function buildSharedWithMeWhereClause(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<Prisma.FileAssetWhereInput> {
  const notSoleSelfOrigin: Prisma.FileAssetWhereInput = {
    NOT: {
      OR: [{ ownerId: employeeId }, { AND: [{ ownerId: null }, { createdById: employeeId }] }],
    },
  };
  const grantWhere = await buildDriveExplicitFileGrantWhere(prisma, employeeId);
  return { OR: [notSoleSelfOrigin, grantWhere] };
}

function selfOriginWhere(employeeId: string): Prisma.FileAssetWhereInput {
  return {
    OR: [{ ownerId: employeeId }, { createdById: employeeId }],
  };
}

async function layeredSensitivityWhere(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<Prisma.FileAssetWhereInput> {
  const grantWhere = await buildDriveExplicitFileGrantWhere(prisma, employeeId);
  return {
    OR: [
      {
        AND: [
          { visibility: { notIn: [...SELF_ONLY_VISIBILITIES] as never[] } },
          { confidentiality: { notIn: [...SENSITIVE_CONFIDENTIALITIES] as never[] } },
        ],
      },
      selfOriginWhere(employeeId),
      grantWhere,
    ],
  };
}

async function ownScopeWhere(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<Prisma.FileAssetWhereInput> {
  const grantWhere = await buildDriveExplicitFileGrantWhere(prisma, employeeId);
  return {
    OR: [{ ownerId: employeeId }, { createdById: employeeId }, grantWhere],
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
    return layeredSensitivityWhere(prisma, access.employeeId);
  }
  const inheritedWhere = await buildDriveInheritedLinkFileAccessWhere(prisma, access);
  const grantWhere = await buildDriveExplicitFileGrantWhere(prisma, access.employeeId);
  if (scope === 'OWN') {
    return { OR: [await ownScopeWhere(prisma, access.employeeId), inheritedWhere] };
  }
  if (scope === 'DEPARTMENT') {
    const colleagueRows = await prisma.employeeDepartment.findMany({
      where: { departmentId: { in: access.departmentIds } },
      select: { employeeId: true },
      distinct: ['employeeId'],
    });
    const colleagueIds = colleagueRows.map((row) => row.employeeId);
    const departmentScope: Prisma.FileAssetWhereInput = {
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
        await layeredSensitivityWhere(prisma, access.employeeId),
      ],
    };
    return { OR: [departmentScope, inheritedWhere] };
  }
  return { OR: [await ownScopeWhere(prisma, access.employeeId), inheritedWhere] };
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

export async function buildDriveAssetGrantAccessWhere(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<Prisma.FileAssetWhereInput> {
  return buildDriveExplicitFileGrantWhere(prisma, employeeId, permissions);
}
