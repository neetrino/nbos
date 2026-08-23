/** Display fragment of a provider key: first N + last M characters. */
export const PROVIDER_KEY_PREFIX_CHARS = 3;
export const PROVIDER_KEY_SUFFIX_CHARS = 4;
export const PROVIDER_API_KEY_MIN_LENGTH = 20;
export const PROVIDER_NAME_MAX_LENGTH = 120;
export const PROVIDER_METADATA_MAX_LENGTH = 200;
export const PROVIDER_BASE_URL_MAX_LENGTH = 300;

/**
 * Provider HTTP timeout. Model-list calls are not chat completions; 15s matches
 * the Mail R2 GET family and is long enough for a paginated catalog without
 * hanging a scheduled sync. Recorded 2026-08-22.
 */
export const AI_PROVIDER_HTTP_TIMEOUT_MS = 15_000;

export const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';
export const ANTHROPIC_DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
export const OPENAI_ALLOWED_HOSTS = ['api.openai.com'] as const;
export const ANTHROPIC_ALLOWED_HOSTS = ['api.anthropic.com'] as const;
export const PROVIDER_HTTPS_PORT = 443;
export const HTTP_REDIRECT_STATUS_MIN = 300;
export const HTTP_REDIRECT_STATUS_MAX = 399;
export const ANTHROPIC_API_VERSION = '2023-06-01';
export const ANTHROPIC_MODELS_PAGE_SIZE = 100;
export const AI_PROVIDER_MODEL_LIST_MAX_PAGES = 20;

export const AI_MODEL_CATALOG_SYNC_JOB_NAME = 'ai-model-catalog-sync';
export const AI_MODEL_CATALOG_SYNC_ENABLED_ENV = 'SCHEDULER_AI_MODEL_CATALOG_SYNC_ENABLED';
export const AI_MODEL_CATALOG_SYNC_CRON_ENV = 'SCHEDULER_AI_MODEL_CATALOG_SYNC_CRON';

/**
 * Default cadence for the scheduled catalog sync contract. Catalogs change
 * slowly; six hours avoids turning discovery into a polling amplifier.
 * Enable via SCHEDULER_AI_MODEL_CATALOG_SYNC_ENABLED. Recorded 2026-08-22.
 */
export const AI_MODEL_CATALOG_SYNC_DEFAULT_CRON = '0 */6 * * *';

export const PROVIDER_SECRET_FIELD_NAMES = [
  'apiKey',
  'encryptedApiKey',
  'secret',
  'authorization',
  'x-api-key',
] as const;
