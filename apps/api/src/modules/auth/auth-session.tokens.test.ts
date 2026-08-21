import { describe, expect, it } from 'vitest';
import {
  assertAuthSessionV2Config,
  isAuthSessionV2IssueEnabled,
  resolveAuthAccessTokenTtlSeconds,
  shouldIssueAuthSessionV2,
} from './auth-session.flags';
import {
  generateRefreshTokenPair,
  hashRefreshSecret,
  parseRefreshToken,
  refreshHashesEqual,
} from './auth-session.tokens';

describe('auth-session.tokens', () => {
  it('generates opaque sessionId.secret and never equals hash', () => {
    const sessionId = 'clxxxxxxxx';
    const { rawToken, secret } = generateRefreshTokenPair(sessionId);
    expect(rawToken.startsWith(`${sessionId}.`)).toBe(true);
    const pepper = 'x'.repeat(32);
    const hash = hashRefreshSecret(secret, pepper);
    expect(hash).not.toContain(secret);
    expect(hash).toHaveLength(64);
    expect(refreshHashesEqual(hash, hashRefreshSecret(secret, pepper))).toBe(true);
    expect(refreshHashesEqual(hash, hashRefreshSecret('other', pepper))).toBe(false);
  });

  it('parses refresh token', () => {
    expect(parseRefreshToken('abc.def')).toEqual({ sessionId: 'abc', secret: 'def' });
    expect(parseRefreshToken('bad')).toBeNull();
  });
});

describe('auth-session.flags', () => {
  it('defaults V2 issue off until env is set', () => {
    expect(isAuthSessionV2IssueEnabled({})).toBe(false);
  });

  it('validates access TTL range', () => {
    expect(resolveAuthAccessTokenTtlSeconds({})).toBe(600);
    expect(() => resolveAuthAccessTokenTtlSeconds({ AUTH_ACCESS_TOKEN_TTL_SECONDS: '60' })).toThrow(
      /out of range/,
    );
  });

  it('requires pepper and cookie name for V2 boot', () => {
    expect(() =>
      assertAuthSessionV2Config({
        AUTH_REFRESH_COOKIE_NAME: 'nbos_refresh',
      }),
    ).toThrow(/PEPPER/);
    expect(() =>
      assertAuthSessionV2Config({
        AUTH_REFRESH_TOKEN_PEPPER: 'x'.repeat(32),
      }),
    ).toThrow(/COOKIE_NAME/);
  });

  it('canary allowlist gates issue when the flag is still used', () => {
    const env = {
      AUTH_SESSION_V2_ISSUE_ENABLED: 'true',
      AUTH_SESSION_V2_CANARY_USER_IDS: 'a,b',
    };
    expect(shouldIssueAuthSessionV2('a', env)).toBe(true);
    expect(shouldIssueAuthSessionV2('c', env)).toBe(false);
  });
});
