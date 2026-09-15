import type { JWT } from 'next-auth/jwt';
import type { NextRequest, NextResponse } from 'next/server';
import { isAccessTokenUsable } from './authjs-session-token';
import { buildClearAuthJsSessionCookie } from './clear-authjs-session-cookie';
import { ensureBackendAccessToken } from './ensure-backend-access-token';

export type PersistRotatedAccessCookieResult = 'ok' | 'session-invalid';

/**
 * Persists a rotation that the existing BFF helper already performed.
 * Does not re-sign the incoming session cookie. A revoked refresh expires it.
 */
export async function persistRotatedAccessCookie(
  req: NextRequest,
  sessionToken: JWT | null,
  response: NextResponse,
): Promise<PersistRotatedAccessCookieResult> {
  const accessToken =
    typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : undefined;
  if (!accessToken || isAccessTokenUsable(accessToken)) {
    return 'ok';
  }

  const tokenResult = await ensureBackendAccessToken(req);
  if (tokenResult.kind === 'session-invalid') {
    response.headers.append('Set-Cookie', buildClearAuthJsSessionCookie());
    return 'session-invalid';
  }
  if (tokenResult.kind === 'available' && tokenResult.setCookie) {
    response.headers.append('Set-Cookie', tokenResult.setCookie);
  }
  return 'ok';
}
