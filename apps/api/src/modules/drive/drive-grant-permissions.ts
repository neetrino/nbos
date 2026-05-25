import { BadRequestException } from '@nestjs/common';

/** Explicit file grants per `docs/NBOS/02-Modules/11-Drive/03-Permissions-Sharing-and-Audit.md`. */
export const FILE_GRANT_PERMISSIONS = [
  'VIEW',
  'EDIT_METADATA',
  'UPLOAD_VERSION',
  'SHARE',
  'DELETE',
  'EXPORT',
] as const;

export type FileGrantPermission = (typeof FILE_GRANT_PERMISSIONS)[number];

const ALLOWED = new Set<string>(FILE_GRANT_PERMISSIONS);

export function normalizeFileGrantPermission(input: string | undefined): FileGrantPermission {
  const raw = (input ?? 'VIEW').trim().toUpperCase();
  if (!ALLOWED.has(raw)) {
    throw new BadRequestException(
      `permission must be one of: ${FILE_GRANT_PERMISSIONS.join(', ')}`,
    );
  }
  return raw as FileGrantPermission;
}
