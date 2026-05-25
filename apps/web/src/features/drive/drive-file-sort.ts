export const DRIVE_FILE_SORT_STORAGE_KEY = 'nbos-drive-file-sort';

export type DriveFileSortKey = 'updated' | 'name' | 'size';

/** Parse persisted sort key; invalid or missing values fall back to `updated`. */
export function parseDriveFileSortKey(raw: string | null): DriveFileSortKey {
  return raw === 'name' || raw === 'size' || raw === 'updated' ? raw : 'updated';
}
