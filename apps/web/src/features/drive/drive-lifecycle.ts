import type { FileAsset } from '@/lib/api/drive';

/** Browse active libraries, or unified recoverable Trash (Profile B). */
export type DriveLifecycleView = 'browse' | 'trash';

export const DRIVE_LIFECYCLE_TITLES: Record<Exclude<DriveLifecycleView, 'browse'>, string> = {
  trash: 'Trash',
};

export const DRIVE_LIFECYCLE_HINTS: Record<Exclude<DriveLifecycleView, 'browse'>, string> = {
  trash:
    'Recoverable deletions. Restore to make active again, or purge permanently from the danger zone.',
};

/** Recoverable Trash rows use DELETED status with a trash timestamp. */
export function isDriveFileInTrash(file: FileAsset): boolean {
  return file.status === 'DELETED' && file.deletedAt != null;
}

/** Client guard when list response may be stale. */
export function filterFilesForLifecycleView(
  files: readonly FileAsset[],
  view: Exclude<DriveLifecycleView, 'browse'>,
): FileAsset[] {
  if (view === 'trash') {
    return files.filter(isDriveFileInTrash);
  }
  return [...files];
}
