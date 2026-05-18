import type { DriveLibraryOption } from './drive-options';

/** Metadata passed to `createUploadSession` for library-linked uploads (no `folderId`). */
export function buildDriveLibraryUploadSessionFields(
  library: DriveLibraryOption,
  purposeOverride?: string,
): {
  sourceModule?: string;
  purpose?: string;
  visibility?: string;
} {
  return {
    sourceModule: library.sourceModules?.[0],
    purpose: purposeOverride ?? library.purposes?.[0] ?? 'OTHER',
    visibility: library.visibility?.[0] ?? 'INTERNAL',
  };
}
