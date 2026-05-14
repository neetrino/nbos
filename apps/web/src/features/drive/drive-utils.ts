import type { FileAsset } from '@/lib/api/drive';
import type { DriveLibraryOption, DriveSpaceOption, DriveViewMode } from './drive-options';
import { DRIVE_LIBRARIES, DEFAULT_DRIVE_SPACE } from './drive-options';
import { toFileSizeNumber } from './drive-format';
import type { DriveStats } from './drive-types';

export function getInitialViewMode(): DriveViewMode {
  return 'cards';
}

/** SSR-safe: always matches server output; hydrate preferences in `useLayoutEffect`. */
export function getInitialDriveSpace(): DriveSpaceOption {
  return DEFAULT_DRIVE_SPACE;
}

export type FileMatchesLibraryContext = {
  /** When `shared`, refines the `shared` library row (active vs archive split). */
  spaceKey?: string;
};

export function fileMatchesLibrary(
  file: FileAsset,
  library: DriveLibraryOption,
  ctx?: FileMatchesLibraryContext,
): boolean {
  if (library.key === 'all') return true;
  if (library.key === 'shared' && ctx?.spaceKey === 'shared') {
    return file.status !== 'ARCHIVED';
  }
  if (library.status) return file.status === library.status;
  const linkTypes = file.links.map((link) => link.entityType);
  const hasModule = library.sourceModules?.includes((file.sourceModule ?? '').toUpperCase());
  const hasEntity = library.entityTypes?.some((entityType) => linkTypes.includes(entityType));
  const hasPurpose = file.purpose ? library.purposes?.includes(file.purpose) : false;
  const hasVisibility = library.visibility?.includes(file.visibility);
  return Boolean(hasModule || hasEntity || hasPurpose || hasVisibility);
}

export function buildDriveStats(files: FileAsset[]): DriveStats {
  return files.reduce<DriveStats>(
    (stats, file) => ({
      totalFiles: stats.totalFiles + 1,
      totalSize: stats.totalSize + toFileSizeNumber(file.sizeBytes),
      linkedFiles: stats.linkedFiles + (file.links.length > 0 ? 1 : 0),
      sensitiveFiles: stats.sensitiveFiles + (isSensitiveFile(file) ? 1 : 0),
      approvedFiles: stats.approvedFiles + (file.status === 'APPROVED' ? 1 : 0),
    }),
    { totalFiles: 0, totalSize: 0, linkedFiles: 0, sensitiveFiles: 0, approvedFiles: 0 },
  );
}

export function buildLibraryCounts(files: FileAsset[], spaceKey?: string): Map<string, number> {
  return new Map(
    DRIVE_LIBRARIES.map((library) => [
      library.key,
      files.filter((file) => fileMatchesLibrary(file, library, { spaceKey })).length,
    ]),
  );
}

export function badgeVariant(value: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (value.includes('SENSITIVE') || value.includes('SECRET')) return 'destructive';
  if (value === 'APPROVED' || value === 'CLIENT_VISIBLE' || value === 'PARTNER_VISIBLE') {
    return 'default';
  }
  if (value === 'ARCHIVED') return 'outline';
  return 'secondary';
}

function isSensitiveFile(file: FileAsset): boolean {
  return file.confidentiality.includes('SENSITIVE') || file.confidentiality.includes('SECRET');
}
