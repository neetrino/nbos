/**
 * Recording notice version + copy.
 * Copy is an explicit placeholder pending legal approval — not binding wording.
 */
export const VIDEO_MEETING_RECORDING_NOTICE_VERSION = 'pending-legal-v0' as const;

export const VIDEO_MEETING_RECORDING_NOTICE_COPY =
  'PLACEHOLDER — pending legal approval. This text is not final legal notice, does not define retention, and must not be treated as binding consent language.' as const;

/** Private object-key prefix inside the recording bucket. */
export const VIDEO_MEETING_RECORDING_OBJECT_PREFIX = 'video-meetings' as const;

/** Env: when "false"/unset with missing storage, start-recording returns 503. */
export const VIDEO_MEETINGS_RECORDING_STORAGE_ENDPOINT_ENV =
  'VIDEO_MEETINGS_RECORDING_S3_ENDPOINT' as const;
export const VIDEO_MEETINGS_RECORDING_STORAGE_BUCKET_ENV =
  'VIDEO_MEETINGS_RECORDING_S3_BUCKET' as const;
export const VIDEO_MEETINGS_RECORDING_STORAGE_ACCESS_KEY_ENV =
  'VIDEO_MEETINGS_RECORDING_S3_ACCESS_KEY_ID' as const;
export const VIDEO_MEETINGS_RECORDING_STORAGE_SECRET_ENV =
  'VIDEO_MEETINGS_RECORDING_S3_SECRET_ACCESS_KEY' as const;
export const VIDEO_MEETINGS_RECORDING_STORAGE_REGION_ENV =
  'VIDEO_MEETINGS_RECORDING_S3_REGION' as const;

/** Fall back to Drive R2 credentials when dedicated recording S3 env is absent. */
export const R2_ACCOUNT_ID_ENV = 'R2_ACCOUNT_ID' as const;
export const R2_ACCESS_KEY_ID_ENV = 'R2_ACCESS_KEY_ID' as const;
export const R2_SECRET_ACCESS_KEY_ENV = 'R2_SECRET_ACCESS_KEY' as const;
export const R2_BUCKET_NAME_ENV = 'R2_BUCKET_NAME' as const;

/** DI override for unit tests (fake egress client). */
export const VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN = 'VIDEO_MEETINGS_EGRESS_CLIENT' as const;

/** DI override for unit tests (fake object store). */
export const VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN =
  'VIDEO_MEETINGS_RECORDING_OBJECT_STORE' as const;
