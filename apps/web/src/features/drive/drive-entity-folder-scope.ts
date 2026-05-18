/** Matches API `drive-folder-scope.ts` (Library entity folder trees). */
export const DRIVE_ENTITY_FOLDER_SCOPES = [
  'DEAL',
  'LEAD',
  'PROJECT',
  'PRODUCT',
  'EXTENSION',
  'TASK',
  'WORKSPACE',
  'SUPPORT_TICKET',
] as const;

export type DriveEntityFolderScopeType = (typeof DRIVE_ENTITY_FOLDER_SCOPES)[number];

export type DriveEntityFolderScope = {
  scopeEntityType: DriveEntityFolderScopeType;
  scopeEntityId: string;
};

/** Maps FileLink entity types to folder scope types accepted by the API. */
export function resolveDriveEntityFolderScope(
  entityType: string,
  entityId: string,
): DriveEntityFolderScope | null {
  const normalized = entityType.trim().toUpperCase();
  const id = entityId.trim();
  if (!normalized || !id) return null;

  const scopeType =
    normalized === 'WORK_SPACE'
      ? 'WORKSPACE'
      : DRIVE_ENTITY_FOLDER_SCOPES.includes(normalized as DriveEntityFolderScopeType)
        ? (normalized as DriveEntityFolderScopeType)
        : null;

  if (!scopeType) return null;
  return { scopeEntityType: scopeType, scopeEntityId: id };
}
