import { describe, it, expect } from 'vitest';
import {
  JWT_DENYLIST_REDIS_PREFIX,
  jwtDenylistRedisKey,
  ttlSecondsUntil,
} from './jwt-denylist-redis';

describe('jwt-denylist-redis', () => {
  it('builds prefixed redis keys', () => {
    expect(jwtDenylistRedisKey('abc')).toBe(`${JWT_DENYLIST_REDIS_PREFIX}abc`);
  });

  it('returns zero ttl for expired tokens', () => {
    expect(ttlSecondsUntil(Date.now() - 1)).toBe(0);
  });

  it('returns at least one second for valid tokens', () => {
    expect(ttlSecondsUntil(Date.now() + 500)).toBe(1);
    expect(ttlSecondsUntil(Date.now() + 5_000)).toBe(5);
  });
});
