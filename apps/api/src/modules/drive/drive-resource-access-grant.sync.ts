import type { PlatformAccessActionEnum, Prisma, PrismaClient } from '@nbos/database';
import { activeResourceAccessGrantWhere } from '../credentials/credential-active-grant.where';
import type { FileGrantPermission } from './drive-grant-permissions';
import { FILE_GRANT_PERMISSIONS } from './drive-grant-permissions';

/** Platform {@link ResourceAccessGrant} resource type for Drive file assets. */
export const DRIVE_FILE_ASSET_RESOURCE_TYPE = 'drive_file_asset';

/** Platform {@link ResourceAccessGrant} resource type for Drive folders. */
export const DRIVE_FOLDER_RESOURCE_TYPE = 'drive_folder';

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
    resourceType?: typeof DRIVE_FILE_ASSET_RESOURCE_TYPE | typeof DRIVE_FOLDER_RESOURCE_TYPE;
  },
): Promise<void> {
  const resourceType = input.resourceType ?? DRIVE_FILE_ASSET_RESOURCE_TYPE;
  await client.resourceAccessGrant.upsert({
    where: {
      resourceType_resourceId_employeeId: {
        resourceType,
        resourceId: input.fileAssetId,
        employeeId: input.employeeId,
      },
    },
    create: {
      resourceType,
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
  resourceType:
    | typeof DRIVE_FILE_ASSET_RESOURCE_TYPE
    | typeof DRIVE_FOLDER_RESOURCE_TYPE = DRIVE_FILE_ASSET_RESOURCE_TYPE,
): Promise<void> {
  await client.resourceAccessGrant.updateMany({
    where: {
      resourceType,
      resourceId: fileAssetId,
      employeeId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function loadPlatformGrantResourceIds(
  prisma: InstanceType<typeof PrismaClient>,
  resourceType: typeof DRIVE_FILE_ASSET_RESOURCE_TYPE | typeof DRIVE_FOLDER_RESOURCE_TYPE,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<string[]> {
  const rows = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType,
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

/** Folder visibility via platform {@link ResourceAccessGrant} on {@link DRIVE_FOLDER_RESOURCE_TYPE}. */
export async function buildDriveExplicitFolderGrantWhere(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<Prisma.DriveFolderWhereInput> {
  const ids = await loadPlatformGrantResourceIds(
    prisma,
    DRIVE_FOLDER_RESOURCE_TYPE,
    employeeId,
    permissions,
  );
  if (ids.length === 0) return { id: { in: [] } };
  return { id: { in: ids } };
}

export async function employeeHasActiveDriveFolderGrant(
  prisma: InstanceType<typeof PrismaClient>,
  folderId: string,
  employeeId: string,
): Promise<boolean> {
  const ids = await loadPlatformGrantResourceIds(prisma, DRIVE_FOLDER_RESOURCE_TYPE, employeeId);
  return ids.includes(folderId);
}

export async function employeeCanManageDriveFolderGrants(
  prisma: InstanceType<typeof PrismaClient>,
  folderId: string,
  employeeId: string,
): Promise<boolean> {
  const editIds = await loadPlatformGrantResourceIds(
    prisma,
    DRIVE_FOLDER_RESOURCE_TYPE,
    employeeId,
    ['EDIT_METADATA', 'SHARE', 'UPLOAD_VERSION'],
  );
  return editIds.includes(folderId);
}

async function loadPlatformGrantFileIds(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<string[]> {
  return loadPlatformGrantResourceIds(
    prisma,
    DRIVE_FILE_ASSET_RESOURCE_TYPE,
    employeeId,
    permissions,
  );
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
  const { buildDriveFolderInheritedFileGrantWhere } = await import('./drive-folder-grant-inherit');
  const legacy = activeFileAssetGrantWhere(employeeId, permissions);
  const platformIds = await loadPlatformGrantFileIds(prisma, employeeId, permissions);
  const folderInherited = await buildDriveFolderInheritedFileGrantWhere(
    prisma,
    employeeId,
    permissions,
  );
  const parts: Prisma.FileAssetWhereInput[] = [legacy, folderInherited];
  if (platformIds.length > 0) {
    parts.push({ id: { in: platformIds } });
  }
  return { OR: parts };
}
