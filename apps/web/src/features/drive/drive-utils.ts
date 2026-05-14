import type { FileAsset } from '@/lib/api/drive';
import type { DriveLibraryOption, DriveSpaceOption, DriveViewMode } from './drive-options';
import {
  DRIVE_LIBRARIES,
  DRIVE_SPACE_STORAGE_KEY,
  DRIVE_SPACES,
  DEFAULT_DRIVE_SPACE,
  DRIVE_VIEW_MODE_STORAGE_KEY,
} from './drive-options';
import { toFileSizeNumber } from './drive-format';
import type { DriveStats } from './drive-types';

export function getInitialViewMode(): DriveViewMode {
  if (typeof window === 'undefined') return 'cards';
  const saved = window.localStorage.getItem(DRIVE_VIEW_MODE_STORAGE_KEY);
  return saved === 'cards' || saved === 'list' || saved === 'table' ? saved : 'cards';
}

export function getInitialDriveSpace(): DriveSpaceOption {
  if (typeof window === 'undefined') return DEFAULT_DRIVE_SPACE;
  const raw = window.localStorage.getItem(DRIVE_SPACE_STORAGE_KEY);
  if (!raw) return DEFAULT_DRIVE_SPACE;
  const found = DRIVE_SPACES.find((space) => space.key === raw);
  return found ?? DEFAULT_DRIVE_SPACE;
}

export function fileMatchesLibrary(file: FileAsset, library: DriveLibraryOption): boolean {
  if (library.key === 'all') return true;
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

export function buildLibraryCounts(files: FileAsset[]): Map<string, number> {
  return new Map(
    DRIVE_LIBRARIES.map((library) => [
      library.key,
      files.filter((file) => fileMatchesLibrary(file, library)).length,
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
