import { encode, getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
}

/**
 * Calls Nest refresh with body token (BFF marker). Updates encrypted Auth.js JWT cookie
 * with the new access (and refresh) tokens. Never exposes refresh to client JS.
 */
export async function refreshBackendSession(req: NextRequest): Promise<{
  accessToken: string;
  setCookie?: string;
} | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const useSecure = process.env.NODE_ENV === 'production';
  const cookieName = sessionCookieName();

  const token = await getToken({
    req,
    secret,
    secureCookie: useSecure,
    salt: cookieName,
  });
  if (!token) return null;

  const refreshToken = typeof token.refreshToken === 'string' ? token.refreshToken : undefined;
  if (!refreshToken) return null;

  const res = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Nbos-Bff': '1',
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    data: {
      accessToken: string;
      refreshToken?: string;
      sessionId?: string;
      user: { id: string; email: string; firstName: string; lastName: string };
    };
  };

  const { accessToken, refreshToken: nextRefresh, sessionId, user } = body.data;

  const newJwt = await encode({
    secret,
    salt: cookieName,
    token: {
      ...token,
      accessToken,
      refreshToken: nextRefresh ?? refreshToken,
      sessionId: sessionId ?? (typeof token.sessionId === 'string' ? token.sessionId : undefined),
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const cookieParts = [
    `${cookieName}=${newJwt}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (useSecure) cookieParts.push('Secure');

  return { accessToken, setCookie: cookieParts.join('; ') };
}
