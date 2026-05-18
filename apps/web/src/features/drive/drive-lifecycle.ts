export type DriveLifecycleView = 'browse' | 'archive' | 'trash';

export const DRIVE_LIFECYCLE_TITLES: Record<Exclude<DriveLifecycleView, 'browse'>, string> = {
  archive: 'Archive',
  trash: 'Trash',
};

export const DRIVE_LIFECYCLE_HINTS: Record<Exclude<DriveLifecycleView, 'browse'>, string> = {
  archive: 'Hidden from active views. Restore or move to Trash.',
  trash: 'Deleted files. Restore to make active again.',
};
