const DEFAULT_REFRESH_COOKIE_NAME = 'nbos_refresh';

export function resolveWebAuthRefreshCookieName(env: NodeJS.ProcessEnv = process.env): string {
  const name = env.AUTH_REFRESH_COOKIE_NAME?.trim();
  return name && name.length > 0 ? name : DEFAULT_REFRESH_COOKIE_NAME;
}

/**
 * Collect Set-Cookie header lines from a fetch Response (Node / undici).
 */
export function readSetCookieHeaderLines(headers: Headers): string[] {
  const withGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetSetCookie.getSetCookie === 'function') {
    return withGetSetCookie.getSetCookie();
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

/**
 * Parse Nest's refresh cookie from Set-Cookie response headers.
 * BFF/Auth.js uses this instead of reading refreshToken from JSON.
 */
export function parseRefreshTokenFromSetCookieHeaders(
  setCookieHeaders: readonly string[],
  cookieName: string = resolveWebAuthRefreshCookieName(),
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

export function parseRefreshTokenFromResponse(
  res: { headers: Headers },
  cookieName?: string,
): string | undefined {
  return parseRefreshTokenFromSetCookieHeaders(readSetCookieHeaderLines(res.headers), cookieName);
}
