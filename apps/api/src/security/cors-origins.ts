const DEFAULT_DEV_ORIGINS = ['http://localhost:3000'] as const;

/**
 * Browser origins allowed for CORS and Socket.IO (comma-separated `CORS_ORIGIN`).
 * Empty/unset in development defaults to local Next.js.
 */
export function parseCorsOriginsFromEnv(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw?.trim()) {
    return [...DEFAULT_DEV_ORIGINS];
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Fail fast in production: no wildcard with credentials, no empty allowlist.
 */
export function assertCorsOriginsSafeForProduction(origins: string[]): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  if (origins.length === 0) {
    throw new Error(
      'CORS_ORIGIN must list at least one origin in production (comma-separated, no spaces-only entries).',
    );
  }
  if (origins.some((o) => o === '*')) {
    throw new Error(
      'CORS_ORIGIN must not be "*" in production when credentials are enabled; use an explicit allowlist.',
    );
  }
}
