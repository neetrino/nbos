export const BACKEND_LOGIN_ERROR = {
  invalidCredentials: 'invalid_credentials',
  tooManyAttempts: 'too_many_attempts',
  serviceUnavailable: 'service_unavailable',
  accountDeactivated: 'account_deactivated',
} as const;

export type BackendLoginErrorCode = (typeof BACKEND_LOGIN_ERROR)[keyof typeof BACKEND_LOGIN_ERROR];

export const SIGN_IN_SESSION_ENDED_REASON = 'session_ended';

export class BackendLoginError extends Error {
  readonly code: BackendLoginErrorCode;

  constructor(code: BackendLoginErrorCode) {
    super(code);
    this.name = 'BackendLoginError';
    this.code = code;
  }
}
