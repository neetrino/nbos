import { describe, expect, it } from 'vitest';
import { resolveGoogleContactsRefreshToken } from './google-contacts-oauth.refresh-token';

describe('resolveGoogleContactsRefreshToken', () => {
  it('prefers a fresh token from Google', () => {
    expect(resolveGoogleContactsRefreshToken('new-token', 'old-token', true)).toBe('new-token');
  });

  it('reuses the stored token on same-email reconnect', () => {
    expect(resolveGoogleContactsRefreshToken(undefined, 'stored-token', false)).toBe(
      'stored-token',
    );
  });

  it('refuses to reuse the stored token when the Google email changed', () => {
    expect(resolveGoogleContactsRefreshToken(undefined, 'stored-token', true)).toBeNull();
  });
});
