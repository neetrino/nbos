import { encode } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { authJsSessionCookieName, readAuthJsSessionToken } from './authjs-session-token';
import { parseRefreshTokenFromResponse } from './parse-nest-refresh-cookie';
import { resolveWebSessionMaxAgeSeconds } from './session-lifetime';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const BACKEND_REFRESH_TIMEOUT_MS = 10_000;

export type BackendRefreshResult =
  | { kind: 'refreshed'; accessToken: string; setCookie?: string }
  | { kind: 'session-invalid' }
  | { kind: 'temporarily-unavailable'; status: 429 | 503; retryAfter?: string };

/**
 * Calls Nest refresh with body token (BFF marker). Updates encrypted Auth.js JWT cookie
 * with the new access (and refresh) tokens. Rotated refresh is read from Nest Set-Cookie
 * (not JSON). Never exposes refresh to client JS.
 */
export async function refreshBackendSession(req: NextRequest): Promise<BackendRefreshResult> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return { kind: 'temporarily-unavailable', status: 503 };

  const useSecure = process.env.NODE_ENV === 'production';
  const cookieName = authJsSessionCookieName();
  const token = await readAuthJsSessionToken(req);
  if (!token) return { kind: 'session-invalid' };

  const refreshToken = typeof token.refreshToken === 'string' ? token.refreshToken : undefined;
  if (!refreshToken) return { kind: 'session-invalid' };

  let res: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BACKEND_REFRESH_TIMEOUT_MS);
  timeout.unref?.();
  try {
    res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Nbos-Bff': '1',
      },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });
  } catch {
    return { kind: 'temporarily-unavailable', status: 503 };
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) return { kind: 'session-invalid' };
  if (res.status === 429) {
    return {
      kind: 'temporarily-unavailable',
      status: 429,
      retryAfter: res.headers.get('retry-after') ?? undefined,
    };
  }
  if (!res.ok) return { kind: 'temporarily-unavailable', status: 503 };

  let body: {
    data?: {
      accessToken?: unknown;
      sessionId?: unknown;
      user?: {
        id?: unknown;
        email?: unknown;
        firstName?: unknown;
        lastName?: unknown;
      };
    };
  };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return { kind: 'temporarily-unavailable', status: 503 };
  }

  const { accessToken, sessionId, user } = body.data ?? {};
  if (
    typeof accessToken !== 'string' ||
    !user ||
    typeof user.id !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.firstName !== 'string' ||
    typeof user.lastName !== 'string'
  ) {
    return { kind: 'temporarily-unavailable', status: 503 };
  }

  const nextRefresh = parseRefreshTokenFromResponse(res);

  // A grace response intentionally has no refresh cookie. Returning no Set-Cookie
  // prevents a late response from overwriting the already-rotated browser cookie
  // with the stale refresh it presented.
  if (!nextRefresh || nextRefresh === refreshToken) {
    return { kind: 'refreshed', accessToken };
  }

  const sessionMaxAgeSeconds = resolveWebSessionMaxAgeSeconds();

  const newJwt = await encode({
    secret,
    salt: cookieName,
    token: {
      ...token,
      accessToken,
      refreshToken: nextRefresh,
      sessionId:
        typeof sessionId === 'string'
          ? sessionId
          : typeof token.sessionId === 'string'
            ? token.sessionId
            : undefined,
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    maxAge: sessionMaxAgeSeconds,
  });

  const cookieParts = [
    `${cookieName}=${newJwt}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${sessionMaxAgeSeconds}`,
  ];
  if (useSecure) cookieParts.push('Secure');

  return { kind: 'refreshed', accessToken, setCookie: cookieParts.join('; ') };
}
