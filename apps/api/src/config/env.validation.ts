/**
 * Fail-fast environment validation, run by `ConfigModule.forRoot({ validate })`
 * at API boot. Prevents the app from starting with missing/weak/placeholder
 * secrets (especially in production).
 */

const MIN_SECRET_LENGTH = 32;

/** Values that clearly came from `.env.example` and must never reach production. */
const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /change[-_ ]?this/i,
  /change[-_ ]?me/i,
  /your[-_ ]/i,
  /generate[-_ ]?with/i,
  /\bexample\b/i,
  /xxx/i,
];

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

function looksLikePlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const isProduction = config['NODE_ENV'] === 'production';
  const errors: string[] = [];

  // Hard requirements in every environment (already used via getOrThrow at runtime).
  const requiredAlways = ['DATABASE_URL', 'JWT_SECRET', 'CREDENTIALS_ENCRYPTION_KEY'];
  for (const key of requiredAlways) {
    if (isBlank(config[key])) errors.push(`${key} is required`);
  }

  // Secret strength + placeholder rejection (enforced in production).
  if (isProduction) {
    for (const key of ['JWT_SECRET', 'CREDENTIALS_ENCRYPTION_KEY']) {
      const value = config[key];
      if (typeof value !== 'string') continue;
      if (value.length < MIN_SECRET_LENGTH) {
        errors.push(`${key} must be at least ${MIN_SECRET_LENGTH} characters in production`);
      }
      if (looksLikePlaceholder(value)) {
        errors.push(`${key} looks like a placeholder; set a real secret in production`);
      }
    }

    // Production-only requirements.
    for (const key of ['CORS_ORIGIN', 'SCHEDULER_API_KEY']) {
      if (isBlank(config[key])) errors.push(`${key} is required in production`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }

  return config;
}
