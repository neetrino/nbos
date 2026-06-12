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

/** Transitional: Trash includes legacy ARCHIVED rows until DB migration. */
export function isDriveFileInTrash(file: FileAsset): boolean {
  return file.status === 'ARCHIVED' || file.status === 'DELETED';
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
