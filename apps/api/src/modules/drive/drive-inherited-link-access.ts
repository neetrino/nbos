import type { Prisma, PrismaClient } from '@nbos/database';
import type { DriveEntityAccess } from './drive-access.types';
import {
  collectFinanceInheritedLinkTargets,
  collectGeneralInheritedLinkTargets,
  collectLegalInheritedLinkTargets,
} from './drive-inherited-link-targets';
import { buildDriveMultiLinkConfidentialityOr } from './drive-multi-link-confidentiality.where';

const DRIVE_WIDE_SCOPES = new Set<string>(['ALL']);

async function loadScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: DriveEntityAccess,
): Promise<string[]> {
  const ids = new Set<string>([access.employeeId]);
  const scope = access.driveScope?.trim().toUpperCase() ?? 'NONE';
  if (scope !== 'DEPARTMENT' || access.departmentIds.length === 0) {
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

function buildActiveGrantAccess(employeeId: string): Prisma.FileAssetWhereInput {
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

/**
 * Files visible via active `FileLink` to entities in the user's graphs.
 * Multi-link: sensitive confidentiality requires a matching link family (not any participating link).
 */
export async function buildDriveInheritedLinkFileAccessWhere(
  prisma: InstanceType<typeof PrismaClient>,
  access?: DriveEntityAccess,
): Promise<Prisma.FileAssetWhereInput> {
  if (!access?.employeeId) {
    return { id: { in: [] } };
  }
  const scope = access.driveScope?.trim().toUpperCase() ?? 'NONE';
  if (DRIVE_WIDE_SCOPES.has(scope)) {
    return { id: { in: [] } };
  }

  const scopedEmployeeIds = await loadScopedEmployeeIds(prisma, access);
  const [generalTargets, financeTargets, legalTargets] = await Promise.all([
    collectGeneralInheritedLinkTargets(prisma, scopedEmployeeIds),
    collectFinanceInheritedLinkTargets(prisma, scopedEmployeeIds),
    collectLegalInheritedLinkTargets(prisma, scopedEmployeeIds),
  ]);

  const hasAnyTarget =
    generalTargets.length > 0 || financeTargets.length > 0 || legalTargets.length > 0;
  if (!hasAnyTarget) {
    return { id: { in: [] } };
  }

  const employeeId = access.employeeId;
  const grantAccess = buildActiveGrantAccess(employeeId);
  const confidentialityOr = buildDriveMultiLinkConfidentialityOr({
    generalTargets,
    financeTargets,
    legalTargets,
    employeeId,
    grantAccess,
  });

  return {
    AND: [
      { deletedAt: null },
      {
        OR: [
          { visibility: { in: ['INTERNAL', 'PROJECT_TEAM', 'CLIENT_VISIBLE', 'PARTNER_VISIBLE'] } },
          { ownerId: employeeId },
          { createdById: employeeId },
          grantAccess,
        ],
      },
      { OR: confidentialityOr },
    ],
  };
}
