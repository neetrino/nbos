/**
 * AuthSession V2 feature flags and numeric config (strict parsing).
 * Defaults keep legacy auth until explicit rollout.
 */

const TRUE = new Set(['1', 'true', 'yes', 'on']);
const FALSE = new Set(['0', 'false', 'no', 'off', '']);

const MIN_ACCESS_TTL_SECONDS = 300;
const MAX_ACCESS_TTL_SECONDS = 900;
const DEFAULT_ACCESS_TTL_SECONDS = 600;
const DEFAULT_REFRESH_TTL_DAYS = 30;
const DEFAULT_ROTATION_GRACE_SECONDS = 10;
const DEFAULT_CLEANUP_BATCH_SIZE = 500;
const DEFAULT_COOKIE_NAME = 'nbos_refresh';

function parseFlag(raw: string | undefined, defaultValue = false): boolean {
  if (raw === undefined) return defaultValue;
  const v = raw.trim().toLowerCase();
  if (TRUE.has(v)) return true;
  if (FALSE.has(v)) return false;
  throw new Error(`Invalid boolean auth flag value: "${raw}"`);
}

function parsePositiveInt(raw: string | undefined, fallback: number, envKey: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`Invalid ${envKey}="${raw}": must be a positive integer`);
  }
  return n;
}

function parseNonNegativeInt(raw: string | undefined, fallback: number, envKey: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Invalid ${envKey}="${raw}": must be a non-negative integer`);
  }
  return n;
}

export function isAuthSessionV2IssueEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.AUTH_SESSION_V2_ISSUE_ENABLED, false);
}

export function isAuthSessionV2AcceptEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.AUTH_SESSION_V2_ACCEPT_ENABLED, false);
}

export function isAuthLegacyTokenAcceptEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.AUTH_LEGACY_TOKEN_ACCEPT_ENABLED, true);
}

export function isAuthLegacyDenylistReadEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.AUTH_LEGACY_DENYLIST_READ_ENABLED, true);
}

export function isAuthRefreshReuseDetectionEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return parseFlag(env.AUTH_REFRESH_REUSE_DETECTION_ENABLED, true);
}

export function resolveAuthAccessTokenTtlSeconds(env: NodeJS.ProcessEnv = process.env): number {
  const ttl = parsePositiveInt(
    env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
    DEFAULT_ACCESS_TTL_SECONDS,
    'AUTH_ACCESS_TOKEN_TTL_SECONDS',
  );
  if (ttl < MIN_ACCESS_TTL_SECONDS || ttl > MAX_ACCESS_TTL_SECONDS) {
    throw new Error(
      `AUTH_ACCESS_TOKEN_TTL_SECONDS=${ttl} out of range ${MIN_ACCESS_TTL_SECONDS}–${MAX_ACCESS_TTL_SECONDS}`,
    );
  }
  return ttl;
}

export function resolveAuthRefreshTokenTtlDays(env: NodeJS.ProcessEnv = process.env): number {
  return parsePositiveInt(
    env.AUTH_REFRESH_TOKEN_TTL_DAYS,
    DEFAULT_REFRESH_TTL_DAYS,
    'AUTH_REFRESH_TOKEN_TTL_DAYS',
  );
}

export function resolveAuthRefreshRotationGraceSeconds(
  env: NodeJS.ProcessEnv = process.env,
): number {
  return parseNonNegativeInt(
    env.AUTH_REFRESH_ROTATION_GRACE_SECONDS,
    DEFAULT_ROTATION_GRACE_SECONDS,
    'AUTH_REFRESH_ROTATION_GRACE_SECONDS',
  );
}

export function resolveAuthSessionCleanupBatchSize(env: NodeJS.ProcessEnv = process.env): number {
  return parsePositiveInt(
    env.AUTH_SESSION_CLEANUP_BATCH_SIZE,
    DEFAULT_CLEANUP_BATCH_SIZE,
    'AUTH_SESSION_CLEANUP_BATCH_SIZE',
  );
}

export function resolveAuthRefreshCookieName(env: NodeJS.ProcessEnv = process.env): string {
  const name = env.AUTH_REFRESH_COOKIE_NAME?.trim();
  return name && name.length > 0 ? name : DEFAULT_COOKIE_NAME;
}

export function resolveAuthRefreshTokenPepper(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const pepper = env.AUTH_REFRESH_TOKEN_PEPPER?.trim();
  return pepper && pepper.length > 0 ? pepper : undefined;
}

export function resolveAuthCookieSameSite(
  env: NodeJS.ProcessEnv = process.env,
): 'lax' | 'strict' | 'none' {
  const raw = (env.AUTH_COOKIE_SAME_SITE ?? 'lax').trim().toLowerCase();
  if (raw === 'lax' || raw === 'strict' || raw === 'none') return raw;
  throw new Error(`Invalid AUTH_COOKIE_SAME_SITE="${env.AUTH_COOKIE_SAME_SITE}"`);
}

export function resolveAuthCookieSecure(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.AUTH_COOKIE_SECURE === undefined || env.AUTH_COOKIE_SECURE.trim() === '') {
    return env.NODE_ENV === 'production';
  }
  return parseFlag(env.AUTH_COOKIE_SECURE, true);
}

export function resolveAuthCookieDomain(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const domain = env.AUTH_COOKIE_DOMAIN?.trim();
  return domain && domain.length > 0 ? domain : undefined;
}

export function parseAuthSessionV2CanaryUserIds(
  env: NodeJS.ProcessEnv = process.env,
): ReadonlySet<string> {
  const raw = env.AUTH_SESSION_V2_CANARY_USER_IDS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  );
}

export function shouldIssueAuthSessionV2(
  employeeId: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!isAuthSessionV2IssueEnabled(env)) return false;
  const canary = parseAuthSessionV2CanaryUserIds(env);
  if (canary.size === 0) return true;
  return canary.has(employeeId);
}

/**
 * Fail-fast checks when V2 issue is enabled (call from env validation / boot).
 */
export function assertAuthSessionV2Config(env: NodeJS.ProcessEnv = process.env): void {
  const issue = isAuthSessionV2IssueEnabled(env);
  if (!issue) return;

  const pepper = resolveAuthRefreshTokenPepper(env);
  if (!pepper || pepper.length < 32) {
    throw new Error(
      'AUTH_REFRESH_TOKEN_PEPPER is required (≥32 chars) when AUTH_SESSION_V2_ISSUE_ENABLED=true',
    );
  }

  const cookieName = env.AUTH_REFRESH_COOKIE_NAME?.trim();
  if (!cookieName) {
    throw new Error('AUTH_REFRESH_COOKIE_NAME is required when AUTH_SESSION_V2_ISSUE_ENABLED=true');
  }

  const accessTtl = resolveAuthAccessTokenTtlSeconds(env);
  const refreshDays = resolveAuthRefreshTokenTtlDays(env);
  if (refreshDays * 86_400 <= accessTtl) {
    throw new Error('AUTH_REFRESH_TOKEN_TTL_DAYS must yield TTL greater than access TTL');
  }

  resolveAuthCookieSameSite(env);
  const secure = resolveAuthCookieSecure(env);
  if (env.NODE_ENV === 'production' && !secure) {
    const override = parseFlag(env.AUTH_COOKIE_SECURE_OVERRIDE, false);
    if (!override) {
      throw new Error(
        'AUTH_COOKIE_SECURE must be true in production (or set AUTH_COOKIE_SECURE_OVERRIDE=true)',
      );
    }
  }
}

export const AUTH_ACCESS_TTL_BOUNDS = {
  min: MIN_ACCESS_TTL_SECONDS,
  max: MAX_ACCESS_TTL_SECONDS,
  default: DEFAULT_ACCESS_TTL_SECONDS,
} as const;
