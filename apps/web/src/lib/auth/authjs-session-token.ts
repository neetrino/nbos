import { getToken, type JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const MIN_ACCESS_VALIDITY_SECONDS = 30;

export function authJsSessionCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
}

/** Reads the encrypted Auth.js JWT using the same cookie name/salt on every auth path. */
export function readAuthJsSessionToken(req: NextRequest): Promise<JWT | null> {
  return getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    salt: authJsSessionCookieName(),
  });
}

/**
 * Stable single-flight key. Older encrypted cookies may not have `sessionId`,
 * but their opaque refresh still starts with `{sessionId}.`.
 */
export function resolveAuthSessionKey(token: JWT | null): string | undefined {
  if (typeof token?.sessionId === 'string' && token.sessionId.length > 0) {
    return token.sessionId;
  }
  if (typeof token?.refreshToken !== 'string') return undefined;
  const separator = token.refreshToken.indexOf('.');
  return separator > 0 ? token.refreshToken.slice(0, separator) : undefined;
}

/** Expiry inspection is safe because the access JWT came from the encrypted Auth.js cookie. */
export function isAccessTokenUsable(accessToken: string, nowMs: number = Date.now()): boolean {
  try {
    const payloadSegment = accessToken.split('.')[1];
    if (!payloadSegment) return false;
    const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    return (
      typeof payload.exp === 'number' &&
      Number.isFinite(payload.exp) &&
      payload.exp * 1000 > nowMs + MIN_ACCESS_VALIDITY_SECONDS * 1000
    );
  } catch {
    return false;
  }
}
