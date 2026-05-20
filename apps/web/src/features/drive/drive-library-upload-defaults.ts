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
  const isFinanceLibrary = library.key === 'finance';
  return {
    sourceModule: library.sourceModules?.[0],
    purpose: purposeOverride ?? library.purposes?.[0] ?? 'OTHER',
    visibility: isFinanceLibrary ? 'RESTRICTED' : (library.visibility?.[0] ?? 'INTERNAL'),
  };
}
