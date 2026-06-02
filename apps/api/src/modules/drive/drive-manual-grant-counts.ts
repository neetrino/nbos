import type { PrismaClient } from '@nbos/database';
import { activeResourceAccessGrantWhere } from '../credentials/credential-active-grant.where';
import {
  DRIVE_FILE_ASSET_RESOURCE_TYPE,
  DRIVE_FOLDER_RESOURCE_TYPE,
} from './drive-resource-access-grant.sync';

function countDistinctGrantees(
  rows: { resourceId: string; employeeId: string }[],
): Map<string, number> {
  const byResource = new Map<string, Set<string>>();
  for (const row of rows) {
    let set = byResource.get(row.resourceId);
    if (!set) {
      set = new Set<string>();
      byResource.set(row.resourceId, set);
    }
    set.add(row.employeeId);
  }
  const counts = new Map<string, number>();
  for (const [resourceId, set] of byResource) {
    counts.set(resourceId, set.size);
  }
  return counts;
}

/** Active manual grants per Drive folder (platform {@link ResourceAccessGrant} only). */
export async function countDriveFolderManualGrants(
  prisma: InstanceType<typeof PrismaClient>,
  folderIds: readonly string[],
): Promise<Map<string, number>> {
  if (folderIds.length === 0) return new Map();
  const rows = await prisma.resourceAccessGrant.findMany({
    where: {
      resourceType: DRIVE_FOLDER_RESOURCE_TYPE,
      resourceId: { in: [...folderIds] },
      ...activeResourceAccessGrantWhere(),
    },
    select: { resourceId: true, employeeId: true },
  });
  return countDistinctGrantees(
    rows.map((row) => ({ resourceId: row.resourceId, employeeId: row.employeeId })),
  );
}

/** Active manual grants per file (legacy {@link FileAssetGrant} + platform grant). */
export async function countDriveFileManualGrants(
  prisma: InstanceType<typeof PrismaClient>,
  fileAssetIds: readonly string[],
): Promise<Map<string, number>> {
  if (fileAssetIds.length === 0) return new Map();
  const [legacyRows, platformRows] = await Promise.all([
    prisma.fileAssetGrant.findMany({
      where: {
        fileAssetId: { in: [...fileAssetIds] },
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { fileAssetId: true, granteeEmployeeId: true },
    }),
    prisma.resourceAccessGrant.findMany({
      where: {
        resourceType: DRIVE_FILE_ASSET_RESOURCE_TYPE,
        resourceId: { in: [...fileAssetIds] },
        ...activeResourceAccessGrantWhere(),
      },
      select: { resourceId: true, employeeId: true },
    }),
  ]);
  const merged: { resourceId: string; employeeId: string }[] = [
    ...legacyRows.map((row) => ({
      resourceId: row.fileAssetId,
      employeeId: row.granteeEmployeeId,
    })),
    ...platformRows.map((row) => ({
      resourceId: row.resourceId,
      employeeId: row.employeeId,
    })),
  ];
  return countDistinctGrantees(merged);
}

export function attachManualGrantCount<T extends { id: string }>(
  items: T[],
  counts: Map<string, number>,
): (T & { manualGrantCount: number })[] {
  return items.map((item) => ({
    ...item,
    manualGrantCount: counts.get(item.id) ?? 0,
  }));
}
