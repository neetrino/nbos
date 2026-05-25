import type { FileAsset } from '@/lib/api/drive';

export type DriveLifecycleView = 'browse' | 'archive' | 'trash';

export const DRIVE_LIFECYCLE_TITLES: Record<Exclude<DriveLifecycleView, 'browse'>, string> = {
  archive: 'Archive',
  trash: 'Trash',
};

export const DRIVE_LIFECYCLE_HINTS: Record<Exclude<DriveLifecycleView, 'browse'>, string> = {
  archive: 'Hidden from active views. Restore or move to Trash.',
  trash: 'Deleted files. Restore to make active again.',
};

/** Client guard so Archive and Trash never show the same rows if the list response is stale. */
export function filterFilesForLifecycleView(
  files: readonly FileAsset[],
  view: Exclude<DriveLifecycleView, 'browse'>,
): FileAsset[] {
  if (view === 'archive') {
    return files.filter((file) => file.status === 'ARCHIVED');
  }
  return files.filter((file) => file.status === 'DELETED');
}
