import { BACKEND_LOGIN_ERROR, SIGN_IN_SESSION_ENDED_REASON } from './sign-in-errors';

export const SIGN_IN_ERROR_KEYS = [
  'sessionEnded',
  'tooManyAttempts',
  'serviceUnavailable',
  'accountDeactivated',
  'invalidCredentials',
] as const;

export type SignInErrorKey = (typeof SIGN_IN_ERROR_KEYS)[number];

const CODE_TO_KEY: Record<string, SignInErrorKey> = {
  [BACKEND_LOGIN_ERROR.tooManyAttempts]: 'tooManyAttempts',
  [BACKEND_LOGIN_ERROR.serviceUnavailable]: 'serviceUnavailable',
  [BACKEND_LOGIN_ERROR.accountDeactivated]: 'accountDeactivated',
  [BACKEND_LOGIN_ERROR.invalidCredentials]: 'invalidCredentials',
};

const AUTH_JS_SERVER_ERRORS = new Set(['Configuration', 'Callback', 'AccessDenied']);

/** Maps Auth.js / callback query params to a sign-in form message. */
export function resolveSignInErrorKey(input: {
  reason?: string | null;
  code?: string | null;
  error?: string | null;
}): SignInErrorKey | null {
  if (input.reason === SIGN_IN_SESSION_ENDED_REASON) return 'sessionEnded';
  if (input.code && input.code in CODE_TO_KEY) return CODE_TO_KEY[input.code] ?? null;
  if (input.error && AUTH_JS_SERVER_ERRORS.has(input.error)) return 'serviceUnavailable';
  if (input.error) return 'invalidCredentials';
  return null;
}
