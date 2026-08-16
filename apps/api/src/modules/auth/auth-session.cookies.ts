import {
  resolveAuthCookieDomain,
  resolveAuthCookieSameSite,
  resolveAuthCookieSecure,
  resolveAuthRefreshCookieName,
  resolveAuthRefreshTokenTtlDays,
} from './auth-session.flags';

/** Nest refresh cookie path — scoped away from general API routes. */
export const AUTH_REFRESH_COOKIE_PATH = '/api/auth';

export interface RefreshCookieOptions {
  name: string;
  value: string;
  maxAgeSeconds: number;
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  domain?: string;
}

export function buildRefreshCookieOptions(refreshToken: string): RefreshCookieOptions {
  const maxAgeSeconds = resolveAuthRefreshTokenTtlDays() * 86_400;
  const domain = resolveAuthCookieDomain();
  return {
    name: resolveAuthRefreshCookieName(),
    value: refreshToken,
    maxAgeSeconds,
    httpOnly: true,
    secure: resolveAuthCookieSecure(),
    sameSite: resolveAuthCookieSameSite(),
    path: AUTH_REFRESH_COOKIE_PATH,
    ...(domain ? { domain } : {}),
  };
}

export function buildClearRefreshCookieOptions(): Omit<RefreshCookieOptions, 'value'> & {
  value: '';
} {
  const base = buildRefreshCookieOptions('');
  return { ...base, value: '', maxAgeSeconds: 0 };
}

/** Serialize Set-Cookie header value (no secrets logged). */
export function serializeRefreshCookie(opts: RefreshCookieOptions): string {
  const parts = [
    `${opts.name}=${opts.value}`,
    `Max-Age=${opts.maxAgeSeconds}`,
    `Path=${opts.path}`,
    'HttpOnly',
    `SameSite=${opts.sameSite === 'none' ? 'None' : opts.sameSite === 'strict' ? 'Strict' : 'Lax'}`,
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  return parts.join('; ');
}

/**
 * Extract a named cookie value from one or more Set-Cookie header lines.
 * Used by server-side BFF consumers that read Nest's refresh cookie from the response
 * instead of the JSON body.
 */
export function parseNamedCookieFromSetCookieHeaders(
  setCookieHeaders: readonly string[],
  cookieName: string,
): string | undefined {
  const prefix = `${cookieName}=`;
  for (const header of setCookieHeaders) {
    if (!header.startsWith(prefix)) continue;
    const end = header.indexOf(';');
    const raw = end === -1 ? header.slice(prefix.length) : header.slice(prefix.length, end);
    if (!raw) return undefined;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}
