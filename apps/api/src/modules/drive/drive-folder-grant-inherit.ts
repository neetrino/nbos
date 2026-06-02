import type { Prisma, PrismaClient } from '@nbos/database';
import type { FileGrantPermission } from './drive-grant-permissions';
import {
  DRIVE_FOLDER_RESOURCE_TYPE,
  loadPlatformGrantResourceIds,
} from './drive-resource-access-grant.sync';

/** All folder ids in granted roots plus descendant folders (active, not deleted). */
export async function expandDriveFolderSubtreeIds(
  prisma: InstanceType<typeof PrismaClient>,
  rootFolderIds: readonly string[],
): Promise<string[]> {
  const all = new Set(rootFolderIds);
  let frontier = [...rootFolderIds];
  while (frontier.length > 0) {
    const children = await prisma.driveFolder.findMany({
      where: { parentId: { in: frontier }, deletedAt: null },
      select: { id: true },
    });
    frontier = [];
    for (const child of children) {
      if (!all.has(child.id)) {
        all.add(child.id);
        frontier.push(child.id);
      }
    }
  }
  return [...all];
}

/**
 * Files placed under folders where the viewer has an explicit folder grant
 * (including subfolders). Distinct from mere placement without grant.
 */
export async function buildDriveFolderInheritedFileGrantWhere(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
  permissions?: readonly FileGrantPermission[],
): Promise<Prisma.FileAssetWhereInput> {
  const grantedFolderIds = await loadPlatformGrantResourceIds(
    prisma,
    DRIVE_FOLDER_RESOURCE_TYPE,
    employeeId,
    permissions,
  );
  if (grantedFolderIds.length === 0) {
    return { id: { in: [] } };
  }
  const folderIds = await expandDriveFolderSubtreeIds(prisma, grantedFolderIds);
  return {
    folderPlacements: {
      some: {
        folderId: { in: folderIds },
        itemType: 'FILE',
        removedAt: null,
      },
    },
  };
}
