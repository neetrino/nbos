import type { NextRequest } from 'next/server';
import {
  isAccessTokenUsable,
  readAuthJsSessionToken,
  resolveAuthSessionKey,
} from './authjs-session-token';
import { refreshBackendSession } from './refresh-backend-session';
import { runSingleFlightRefresh } from './refresh-registry';

export { isAccessTokenUsable } from './authjs-session-token';

export type BackendAccessTokenResult =
  | { kind: 'available'; accessToken: string; setCookie?: string }
  | { kind: 'session-invalid' }
  | { kind: 'temporarily-unavailable'; status: 429 | 503; retryAfter?: string };

/** Returns a current access JWT, refreshing first when it is expired or nearly expired. */
export async function ensureBackendAccessToken(
  req: NextRequest,
): Promise<BackendAccessTokenResult> {
  const sessionToken = await readAuthJsSessionToken(req);
  const accessToken =
    typeof sessionToken?.accessToken === 'string' ? sessionToken.accessToken : undefined;
  if (accessToken && isAccessTokenUsable(accessToken)) {
    return { kind: 'available', accessToken };
  }

  try {
    const sessionKey = resolveAuthSessionKey(sessionToken);
    const refreshed = sessionKey
      ? await runSingleFlightRefresh(sessionKey, () => refreshBackendSession(req))
      : await refreshBackendSession(req);
    return refreshed.kind === 'refreshed'
      ? {
          kind: 'available',
          accessToken: refreshed.accessToken,
          setCookie: refreshed.setCookie,
        }
      : refreshed;
  } catch {
    return { kind: 'temporarily-unavailable', status: 503 };
  }
}
