/** Platform audit entity for Drive cleanup apply actions. */
export const DRIVE_CLEANUP_AUDIT_ENTITY = 'DriveCleanup';

export const DRIVE_CLEANUP_APPLY_MAX_IDS = 50;

/** Max rows affected when `applyAll` is true (session purge / export artifact TTL). */
export const DRIVE_CLEANUP_APPLY_ALL_CAP = 100;

export const DRIVE_CLEANUP_APPLY_KINDS = [
  'failed_upload_sessions',
  'expired_pending_upload_sessions',
  'orphan_files',
  'temporary_exports',
  'soft_deleted_retention',
  'old_task_attachments',
  'duplicate_checksum',
] as const;

export type DriveCleanupApplyKind = (typeof DRIVE_CLEANUP_APPLY_KINDS)[number];

export const DRIVE_CLEANUP_APPLY_ALL_KINDS = new Set<DriveCleanupApplyKind>([
  'failed_upload_sessions',
  'expired_pending_upload_sessions',
  'temporary_exports',
]);
