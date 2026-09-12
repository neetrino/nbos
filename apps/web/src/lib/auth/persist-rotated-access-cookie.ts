import type { JWT } from 'next-auth/jwt';
import type { NextRequest, NextResponse } from 'next/server';
import { isAccessTokenUsable } from './authjs-session-token';
import { ensureBackendAccessToken } from './ensure-backend-access-token';

/**
 * Persists a rotation that the existing BFF helper already performed.
 * Does not re-sign the incoming session cookie.
 */
export async function persistRotatedAccessCookie(
  req: NextRequest,
  sessionToken: JWT | null,
  response: NextResponse,
): Promise<void> {
  const accessToken =
    typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : undefined;
  if (!accessToken || isAccessTokenUsable(accessToken)) {
    return;
  }

  const tokenResult = await ensureBackendAccessToken(req);
  if (tokenResult.kind === 'available' && tokenResult.setCookie) {
    response.headers.append('Set-Cookie', tokenResult.setCookie);
  }
}
