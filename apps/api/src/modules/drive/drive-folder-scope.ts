import { BadRequestException } from '@nestjs/common';

/** Library entity scopes with dedicated folder trees (see doc 08). */
export const DRIVE_FOLDER_ENTITY_SCOPES = [
  'DEAL',
  'LEAD',
  'PROJECT',
  'PRODUCT',
  'EXTENSION',
  'TASK',
  'WORKSPACE',
  'SUPPORT_TICKET',
] as const;

export type DriveFolderEntityScope = (typeof DRIVE_FOLDER_ENTITY_SCOPES)[number];

export type DriveFolderEntityScopeFilter = {
  scopeEntityType: string;
  scopeEntityId: string;
};

export function parseEntityScope(input: {
  scopeEntityType?: string;
  scopeEntityId?: string;
}): DriveFolderEntityScopeFilter | null {
  const scopeEntityType = input.scopeEntityType?.trim().toUpperCase();
  const scopeEntityId = input.scopeEntityId?.trim();
  if (!scopeEntityType && !scopeEntityId) return null;
  if (!scopeEntityType || !scopeEntityId) {
    throw new BadRequestException('scopeEntityType and scopeEntityId must be provided together.');
  }
  const scopeType = scopeEntityType === 'WORK_SPACE' ? 'WORKSPACE' : scopeEntityType;
  if (!DRIVE_FOLDER_ENTITY_SCOPES.includes(scopeType as DriveFolderEntityScope)) {
    throw new BadRequestException(
      `scopeEntityType must be one of: ${DRIVE_FOLDER_ENTITY_SCOPES.join(', ')}, WORK_SPACE.`,
    );
  }
  return { scopeEntityType: scopeType, scopeEntityId };
}

export function scopeMatchesFolder(
  folder: { scopeEntityType: string | null; scopeEntityId: string | null },
  scope: DriveFolderEntityScopeFilter | null,
): boolean {
  if (!scope) {
    return folder.scopeEntityType === null && folder.scopeEntityId === null;
  }
  return (
    folder.scopeEntityType === scope.scopeEntityType && folder.scopeEntityId === scope.scopeEntityId
  );
}
