import type { PlatformAccessActionEnum, Prisma, PrismaClient } from '@nbos/database';
import { activeResourceAccessGrantWhere } from '../credentials/credential-active-grant.where';
import type { FileGrantPermission } from './drive-grant-permissions';
import { FILE_GRANT_PERMISSIONS } from './drive-grant-permissions';

/** Platform {@link ResourceAccessGrant} resource type for Drive file assets. */
export const DRIVE_FILE_ASSET_RESOURCE_TYPE = 'drive_file_asset';

const PERMISSION_PREFIX = 'drive_permission:';

type GrantClient = Pick<
  InstanceType<typeof PrismaClient>,
  'resourceAccessGrant' | 'fileAssetGrant'
>;

export function mapFileGrantToPlatformLevel(
  permission: FileGrantPermission,
): PlatformAccessActionEnum {
  return permission === 'VIEW' || permission === 'EXPORT' ? 'VIEW' : 'EDIT';
}

/** Stores Drive grant permission in platform grant reason for cross-module audit. */
export function buildDriveGrantReason(
  permission: FileGrantPermission,
  auditReason?: string | null,
): string {
  const base = `${PERMISSION_PREFIX}${permission}`;
  const note = auditReason?.trim();
  return note ? `${base}|${note}` : base;
}

export function parseDriveGrantPermissionFromReason(
  reason: string | null | undefined,
): FileGrantPermission | null {
  if (!reason?.startsWith(PERMISSION_PREFIX)) return null;
  const token = reason.slice(PERMISSION_PREFIX.length).split('|')[0]?.trim().toUpperCase();
  if (!token || !FILE_GRANT_PERMISSIONS.includes(token as FileGrantPermission)) {
    return null;
  }
  return token as FileGrantPermission;
}

export async function syncDriveFileResourceAccessGrant(
  client: GrantClient,
  input: {
    fileAssetId: string;
    employeeId: string;
    permission: FileGrantPermission;
    grantedById: string;
    expiresAt: Date | null;
    auditReason?: string | null;
  },
): Promise<void> {
  await client.resourceAccessGrant.upsert({
    where: {
      resourceType_resourceId_employeeId: {
        resourceType: DRIVE_FILE_ASSET_RESOURCE_TYPE,
        resourceId: input.fileAssetId,
        employeeId: input.employeeId,
      },
    },
    create: {
      resourceType: DRIVE_FILE_ASSET_RESOURCE_TYPE,
      resourceId: input.fileAssetId,
      employeeId: input.employeeId,
      level: mapFileGrantToPlatformLevel(input.permission),
      grantedById: input.grantedById,
      expiresAt: input.expiresAt,
      reason: buildDriveGrantReason(input.permission, input.auditReason),
    },
    update: {
      revokedAt: null,
      level: mapFileGrantToPlatformLevel(input.permission),
      grantedById: input.grantedById,
      expiresAt: input.expiresAt,
      reason: buildDriveGrantReason(input.permission, input.auditReason),
    },
  });
}

export async function revokeDriveFileResourceAccessGrant(
  client: GrantClient,
  fileAssetId: string,
  employeeId: string,
): Promise<void> {
  await client.resourceAccessGrant.updateMany({
    where: {
      resourceType: DRIVE_FILE_ASSET_RESOURCE_TYPE,
      resourceId: fileAssetId,
      employeeId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

async function loadPlatformGrantFileIds(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<string[]> {
  const rows = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: DRIVE_FILE_ASSET_RESOURCE_TYPE,
      employeeId,
      ...activeResourceAccessGrantWhere(),
    },
    select: { resourceId: true, reason: true, level: true },
  });
  if (!permissions || permissions.length === 0) {
    return rows.map((row) => row.resourceId);
  }
  const allowed = new Set(permissions);
  return rows
    .filter((row) => {
      const parsed = parseDriveGrantPermissionFromReason(row.reason);
      if (parsed) return allowed.has(parsed);
      return row.level === 'VIEW' && allowed.has('VIEW');
    })
    .map((row) => row.resourceId);
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

/** File visibility via legacy {@link FileAssetGrant} or platform {@link ResourceAccessGrant}. */
export async function buildDriveExplicitFileGrantWhere(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<Prisma.FileAssetWhereInput> {
  const legacy = activeFileAssetGrantWhere(employeeId, permissions);
  const platformIds = await loadPlatformGrantFileIds(prisma, employeeId, permissions);
  if (platformIds.length === 0) return legacy;
  return { OR: [legacy, { id: { in: platformIds } }] };
}
