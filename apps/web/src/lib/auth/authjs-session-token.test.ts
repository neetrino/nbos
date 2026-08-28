import { describe, expect, it } from 'vitest';
import { resolveAuthSessionKey } from './authjs-session-token';

describe('resolveAuthSessionKey', () => {
  it('prefers the explicit sessionId', () => {
    expect(
      resolveAuthSessionKey({
        sessionId: 'explicit-session',
        refreshToken: 'refresh-session.secret',
      }),
    ).toBe('explicit-session');
  });

  it('supports older encrypted cookies by parsing the opaque refresh prefix', () => {
    expect(resolveAuthSessionKey({ refreshToken: 'refresh-session.secret' })).toBe(
      'refresh-session',
    );
  });

  it('does not invent a key for a malformed or absent refresh', () => {
    expect(resolveAuthSessionKey({ refreshToken: 'malformed' })).toBeUndefined();
    expect(resolveAuthSessionKey({})).toBeUndefined();
  });
});
