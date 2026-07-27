import {
  resolveAuthCookieDomain,
  resolveAuthCookieSameSite,
  resolveAuthCookieSecure,
  resolveAuthRefreshCookieName,
  resolveAuthRefreshTokenTtlDays,
} from './auth-session.flags';

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
    path: '/api/auth',
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
