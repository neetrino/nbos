/** Redis key prefix for revoked JWT `jti` entries (§7.2). */
export const JWT_DENYLIST_REDIS_PREFIX = 'nbos:jwt-denylist:';

export function jwtDenylistRedisKey(jti: string): string {
  return `${JWT_DENYLIST_REDIS_PREFIX}${jti}`;
}

/** TTL in whole seconds until token expiry; at least 1 second when still valid. */
export function ttlSecondsUntil(expiresAtMs: number, nowMs = Date.now()): number {
  const remainingMs = expiresAtMs - nowMs;
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(remainingMs / 1_000));
}
