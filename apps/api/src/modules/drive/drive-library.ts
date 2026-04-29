import { BadRequestException } from '@nestjs/common';

const LIBRARY_CONTEXT_TO_ENTITY_TYPE: Record<string, string> = {
  PROJECT: 'PROJECT',
  PRODUCT: 'PRODUCT',
  TASK: 'TASK',
  SUPPORT: 'SUPPORT_TICKET',
  COMPANY: 'COMPANY',
  DOCUMENT: 'DOCUMENT',
};

/**
 * Maps a logical library context to `FileLink.entityType` values used in NBOS.
 */
export function resolveDriveLibraryEntityType(contextType: string): string {
  const key = contextType.trim().toUpperCase();
  const mapped = LIBRARY_CONTEXT_TO_ENTITY_TYPE[key];
  if (!mapped) {
    throw new BadRequestException(
      `Invalid library contextType. Allowed: ${Object.keys(LIBRARY_CONTEXT_TO_ENTITY_TYPE).join(', ')}`,
    );
  }
  return mapped;
}
