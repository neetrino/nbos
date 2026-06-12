/** Cleanup kinds that support `applyAll` on the API (capped batch). */
export const DRIVE_CLEANUP_APPLY_ALL_KINDS = new Set([
  'failed_upload_sessions',
  'expired_pending_upload_sessions',
  'temporary_exports',
]);

/** Kinds that permanently remove storage or unlink protected assets — stronger confirm copy. */
export const DRIVE_CLEANUP_DANGER_KINDS = new Set([
  'soft_deleted_retention',
  'orphan_files',
  'duplicate_checksum',
  'old_task_attachments',
]);

export function cleanupApplyAllLabel(kind: string): string {
  if (kind === 'temporary_exports') return 'Purge expired export ZIPs (batch)';
  if (kind === 'failed_upload_sessions') return 'Purge all failed sessions';
  if (kind === 'expired_pending_upload_sessions') return 'Purge all expired pending';
  return 'Apply all in category';
}

/** Short helper shown under each cleanup category in the review dashboard. */
export function cleanupCategoryDescription(kind: string): string | null {
  if (kind === 'soft_deleted_retention') {
    return 'Permanently deletes R2 objects and hard-deletes database rows. Not recoverable.';
  }
  if (kind === 'orphan_files') {
    return 'Removes file assets with no active links or folder placements.';
  }
  if (kind === 'duplicate_checksum') {
    return 'Removes duplicate file copies, keeping one owner per checksum.';
  }
  if (kind === 'old_task_attachments') {
    return 'Unlinks task attachment links past the retention threshold.';
  }
  if (kind === 'failed_upload_sessions') {
    return 'Purges failed upload session records and partial uploads.';
  }
  if (kind === 'expired_pending_upload_sessions') {
    return 'Purges expired pending upload sessions.';
  }
  if (kind === 'temporary_exports') {
    return 'Purges expired export ZIP artifacts.';
  }
  return null;
}

/** Browser confirm copy for selected vs batch apply. */
export function cleanupConfirmMessage(
  kind: string,
  count: number,
  mode: 'selected' | 'batch',
): string {
  const base =
    mode === 'batch'
      ? 'Run batch cleanup for this category (up to 100 items)?'
      : `Apply cleanup for ${count} selected item(s)?`;

  if (kind === 'soft_deleted_retention') {
    return `${base}\n\nPERMANENT PURGE: trash files will be deleted from storage and removed from the database. This cannot be undone.`;
  }
  if (DRIVE_CLEANUP_DANGER_KINDS.has(kind)) {
    return `${base}\n\nThis is a destructive action and cannot be undone automatically.`;
  }
  return `${base}\n\nThis cannot be undone automatically.`;
}
