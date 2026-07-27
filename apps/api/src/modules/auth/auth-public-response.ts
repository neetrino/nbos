import type { LoginResult } from './auth.service';

/**
 * Public auth API payload: never includes refreshToken.
 * Refresh is transported only via HttpOnly cookie (and read by the BFF from Set-Cookie).
 */
export type AuthPublicResponse = {
  accessToken: string;
  sessionId?: string;
  tokenVersion: 1 | 2;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export function toAuthPublicResponse(result: LoginResult): AuthPublicResponse {
  return {
    accessToken: result.accessToken,
    ...(result.sessionId ? { sessionId: result.sessionId } : {}),
    tokenVersion: result.tokenVersion,
    user: result.user,
  };
}
