import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ensureBackendAccessToken } from '@/lib/auth/ensure-backend-access-token';
import { SESSION_INVALID_HEADER, SESSION_INVALID_VALUE } from '@/lib/auth/session-state';

/** Short-lived backend JWT for Socket.IO messenger auth (httpOnly session → server fetch). */
export async function GET(req: NextRequest) {
  const result = await ensureBackendAccessToken(req);
  if (result.kind === 'session-invalid') {
    const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    response.headers.set(SESSION_INVALID_HEADER, SESSION_INVALID_VALUE);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }
  if (result.kind === 'temporarily-unavailable') {
    const response = NextResponse.json(
      { message: 'Authentication service temporarily unavailable' },
      { status: result.status },
    );
    if (result.retryAfter) response.headers.set('Retry-After', result.retryAfter);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const response = NextResponse.json({ token: result.accessToken });
  if (result.setCookie) response.headers.append('Set-Cookie', result.setCookie);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
