import { describe, expect, it } from 'vitest';
import { BACKEND_LOGIN_ERROR, SIGN_IN_SESSION_ENDED_REASON } from './sign-in-errors';
import { resolveSignInErrorKey } from './resolve-sign-in-error';

describe('resolveSignInErrorKey', () => {
  it('prefers a revoked-session redirect over Auth.js codes', () => {
    expect(
      resolveSignInErrorKey({
        reason: SIGN_IN_SESSION_ENDED_REASON,
        code: BACKEND_LOGIN_ERROR.invalidCredentials,
        error: 'CredentialsSignin',
      }),
    ).toBe('sessionEnded');
  });

  it('separates throttle and server failures from a wrong password', () => {
    expect(resolveSignInErrorKey({ code: BACKEND_LOGIN_ERROR.tooManyAttempts })).toBe(
      'tooManyAttempts',
    );
    expect(resolveSignInErrorKey({ error: 'Configuration' })).toBe('serviceUnavailable');
    expect(resolveSignInErrorKey({ error: 'CredentialsSignin' })).toBe('invalidCredentials');
  });
});
