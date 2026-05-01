/** Presigned PUT URL lifetime for Drive upload sessions (seconds). */
export const UPLOAD_SESSION_PRESIGN_EXPIRY_SECONDS = 3600;

/** How long a client may take to finish R2 upload and call complete (ms). */
export const UPLOAD_SESSION_TTL_MS = 60 * 60 * 1000;

/** Max length for sanitized upload basename stored in R2 key. */
export const UPLOAD_FILENAME_MAX_LENGTH = 180;
