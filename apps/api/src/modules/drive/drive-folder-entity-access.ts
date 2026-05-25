import type { PrismaClient } from '@nbos/database';
import type { DriveEntityContextAccess } from './drive-access.types';
import { assertDriveEntityContextAccessible } from './drive-entity-context-access';
import type { DriveFolderEntityScopeFilter } from './drive-folder-scope';

/**
 * Ensures the actor may access a Library entity folder tree (DEAL/PROJECT/TASK/…).
 */
export async function assertDriveFolderEntityScopeAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  scope: DriveFolderEntityScopeFilter | null,
  access?: DriveEntityContextAccess,
): Promise<void> {
  if (!scope || !access?.employeeId) return;
  await assertDriveEntityContextAccessible(
    prisma,
    scope.scopeEntityType,
    scope.scopeEntityId,
    access,
  );
}
