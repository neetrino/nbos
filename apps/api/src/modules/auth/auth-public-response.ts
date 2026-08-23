import type { AuthSessionClientKindApi } from '@nbos/shared';
import type { LoginResult } from './auth.service';

/**
 * Public auth API payload. Refresh is in JSON only for native clients.
 * Web always gets refresh via HttpOnly cookie (BFF reads Set-Cookie).
 */
export type AuthPublicResponse = {
  accessToken: string;
  sessionId?: string;
  tokenVersion: 1 | 2;
  clientKind?: AuthSessionClientKindApi;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export function toAuthPublicResponse(
  result: LoginResult,
  options?: { includeRefreshToken?: boolean },
): AuthPublicResponse {
  return {
    accessToken: result.accessToken,
    ...(result.sessionId ? { sessionId: result.sessionId } : {}),
    tokenVersion: result.tokenVersion,
    ...(result.clientKind ? { clientKind: result.clientKind } : {}),
    ...(options?.includeRefreshToken && result.refreshToken
      ? { refreshToken: result.refreshToken }
      : {}),
    user: result.user,
  };
}
