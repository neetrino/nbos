import { parseRefreshTokenFromResponse } from './parse-nest-refresh-cookie';
import {
  BACKEND_LOGIN_ERROR,
  BackendLoginError,
  type BackendLoginErrorCode,
} from './sign-in-errors';

export {
  BACKEND_LOGIN_ERROR,
  BackendLoginError,
  SIGN_IN_SESSION_ENDED_REASON,
} from './sign-in-errors';
export type { BackendLoginErrorCode } from './sign-in-errors';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

type AuthorizedUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  refreshToken?: string;
  sessionId?: string;
};

/**
 * Nest login from the Auth.js authorize hop. Forwards the browser User-Agent so
 * sessions store Chrome · macOS instead of the Node fetch default.
 */
export async function authorizeBackendLogin(
  credentials: Partial<Record<'email' | 'password', unknown>>,
  request: Request,
): Promise<AuthorizedUser | null> {
  const email = typeof credentials.email === 'string' ? credentials.email : '';
  const password = typeof credentials.password === 'string' ? credentials.password : '';
  if (!email || !password) return null;

  const response = await postBackendLogin(email, password, request.headers.get('user-agent'));
  if (response.status === 429) {
    throw new BackendLoginError(BACKEND_LOGIN_ERROR.tooManyAttempts);
  }
  if (response.status >= 500) {
    throw new BackendLoginError(BACKEND_LOGIN_ERROR.serviceUnavailable);
  }
  if (!response.ok) {
    throw new BackendLoginError(await loginErrorFromFailure(response));
  }

  const user = await readLoginUser(response);
  if (!user) throw new BackendLoginError(BACKEND_LOGIN_ERROR.serviceUnavailable);
  return user;
}

async function postBackendLogin(
  email: string,
  password: string,
  userAgent: string | null,
): Promise<Response> {
  try {
    return await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Nbos-Bff': '1',
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new BackendLoginError(BACKEND_LOGIN_ERROR.serviceUnavailable);
  }
}

async function loginErrorFromFailure(response: Response): Promise<BackendLoginErrorCode> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === 'string' && /deactivat/i.test(body.message)) {
      return BACKEND_LOGIN_ERROR.accountDeactivated;
    }
  } catch {
    return BACKEND_LOGIN_ERROR.invalidCredentials;
  }
  return BACKEND_LOGIN_ERROR.invalidCredentials;
}

async function readLoginUser(response: Response): Promise<AuthorizedUser | null> {
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
    body = (await response.json()) as typeof body;
  } catch {
    return null;
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
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    accessToken,
    refreshToken: parseRefreshTokenFromResponse(response),
    sessionId: typeof sessionId === 'string' ? sessionId : undefined,
  };
}
