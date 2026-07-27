/**
 * Build a runtime Neon/Postgres URL with pool-related query params.
 * Does not log credentials. Preserves existing params (e.g. sslmode).
 */

export type BuildRuntimeDatabaseUrlInput = {
  role: 'api' | 'worker' | 'scheduler' | 'all';
  baseUrl: string;
  poolMax: number;
  poolTimeoutSec: number;
  connectTimeoutSec: number;
};

export type BuildRuntimeDatabaseUrlResult = {
  /** Full URL including credentials — never log this. */
  url: string;
  /** Safe diagnostic without userinfo. */
  safeSummary: string;
};

const FORBIDDEN_OVERRIDE_KEYS = new Set([
  'connection_limit',
  'pool_timeout',
  'connect_timeout',
  'connection_timeout',
]);

/**
 * Strip libpq `options` fragments that Neon pooler rejects as startup params.
 * `statement_timeout` is applied via `SET` after connect in `createPrismaClient`.
 * @see https://neon.tech/docs/connect/connection-errors#unsupported-startup-parameter
 */
function stripUnsupportedStartupOptions(options: string): string | null {
  const cleaned = options
    .replace(/-c\s+statement_timeout=\S+/gi, '')
    .replace(/\bstatement_timeout=\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Append / replace pool-related query parameters for node-pg / Neon pooled URLs.
 * Prisma driver adapter uses `pg.Pool`; URL params here are informational.
 * Do not put `statement_timeout` in `options=` — Neon PgBouncer rejects it.
 */
export function buildRuntimeDatabaseUrl(
  input: BuildRuntimeDatabaseUrlInput,
): BuildRuntimeDatabaseUrlResult {
  let parsed: URL;
  try {
    parsed = new URL(input.baseUrl);
  } catch {
    throw new Error('Invalid DATABASE_URL: not a valid URL');
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(`Invalid DATABASE_URL protocol="${parsed.protocol}"`);
  }
  if (!parsed.hostname) {
    throw new Error('Invalid DATABASE_URL: missing hostname');
  }

  const params = new URLSearchParams(parsed.search);
  for (const key of [...params.keys()]) {
    if (FORBIDDEN_OVERRIDE_KEYS.has(key.toLowerCase())) {
      params.delete(key);
    }
  }

  const existingOptions = params.get('options');
  if (existingOptions !== null) {
    const cleaned = stripUnsupportedStartupOptions(existingOptions);
    if (cleaned === null) {
      params.delete('options');
    } else {
      params.set('options', cleaned);
    }
  }

  // Prisma/libpq-style hints (harmless on Neon pooler; Pool.max is authoritative).
  params.set('connection_limit', String(input.poolMax));
  params.set('pool_timeout', String(input.poolTimeoutSec));
  params.set('connect_timeout', String(input.connectTimeoutSec));
  params.set('application_name', `nbos-${input.role}`);

  parsed.search = params.toString();

  const safe = new URL(parsed.toString());
  safe.password = '';
  safe.username = '';
  const safeSummary = `${safe.protocol}//${safe.host}${safe.pathname}?role=${input.role}&connection_limit=${input.poolMax}`;

  return { url: parsed.toString(), safeSummary };
}
