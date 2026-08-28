import { describe, expect, it } from 'vitest';
import { resolveWebSessionMaxAgeSeconds } from './session-lifetime';

describe('resolveWebSessionMaxAgeSeconds', () => {
  it('matches the backend refresh TTL default', () => {
    expect(resolveWebSessionMaxAgeSeconds({})).toBe(30 * 86_400);
  });

  it('uses an explicitly configured refresh TTL', () => {
    expect(resolveWebSessionMaxAgeSeconds({ AUTH_REFRESH_TOKEN_TTL_DAYS: '14' })).toBe(14 * 86_400);
  });

  it('rejects invalid TTL values', () => {
    expect(() => resolveWebSessionMaxAgeSeconds({ AUTH_REFRESH_TOKEN_TTL_DAYS: '0' })).toThrow(
      /positive integer/,
    );
  });
});
