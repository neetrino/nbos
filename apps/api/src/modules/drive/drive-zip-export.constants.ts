/** Max number of FileAsset ids accepted per ZIP export job. */
export const DRIVE_ZIP_EXPORT_MAX_FILES = 40;

/** Max concurrent QUEUED + PROCESSING jobs per requester. */
export const DRIVE_ZIP_EXPORT_MAX_ACTIVE_PER_USER = 2;

/** Soft cap on sum of uncompressed R2 bytes included in one archive. */
export const DRIVE_ZIP_EXPORT_MAX_RAW_BYTES = 350 * 1024 * 1024;

export const DRIVE_ZIP_EXPORT_LIST_LIMIT = 25;

export const DRIVE_ZIP_EXPORT_AUDIT_ENTITY = 'DriveZipExportJob';

export const DRIVE_ZIP_EXPORT_SYNC_FALLBACK_ENV = 'DRIVE_ZIP_EXPORT_SYNC_FALLBACK';

/** Completed export output FileAssets older than this are cleanup candidates. */
export const DRIVE_ZIP_EXPORT_ARTIFACT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Soft-deleted files in Trash longer than this are retention cleanup candidates. */
export const DRIVE_TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Task attachment links older than this may be listed for review cleanup. */
export const DRIVE_TASK_ATTACHMENT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export const DRIVE_CLEANUP_CANDIDATE_PREVIEW_LIMIT = 25;

export const DRIVE_ZIP_EXPORT_DISPATCH_ERROR_MESSAGE =
  'Drive ZIP exports require REDIS_URL (BullMQ worker). For local development only, set DRIVE_ZIP_EXPORT_SYNC_FALLBACK=true. Do not enable sync fallback in production.';
