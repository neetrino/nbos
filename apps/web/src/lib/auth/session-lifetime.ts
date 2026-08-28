const DEFAULT_REFRESH_TTL_DAYS = 30;
const SECONDS_PER_DAY = 24 * 60 * 60;

/** Keep the encrypted Auth.js cookie alive for the backend refresh-session TTL. */
export function resolveWebSessionMaxAgeSeconds(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = env.AUTH_REFRESH_TOKEN_TTL_DAYS;
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_REFRESH_TTL_DAYS * SECONDS_PER_DAY;
  }

  const days = Number(raw);
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(`Invalid AUTH_REFRESH_TOKEN_TTL_DAYS="${raw}": must be a positive integer`);
  }
  return days * SECONDS_PER_DAY;
}
