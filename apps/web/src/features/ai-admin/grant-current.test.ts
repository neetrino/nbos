import { describe, expect, it } from 'vitest';
import { isCurrentGrant } from './grant-current';

const NOW = new Date('2026-08-22T12:00:00.000Z');

describe('isCurrentGrant', () => {
  it('excludes revoked and expired grants', () => {
    expect(isCurrentGrant({ revokedAt: null, expiresAt: null }, NOW)).toBe(true);
    expect(isCurrentGrant({ revokedAt: '2026-08-21T00:00:00.000Z', expiresAt: null }, NOW)).toBe(
      false,
    );
    expect(isCurrentGrant({ revokedAt: null, expiresAt: '2026-08-22T11:59:59.000Z' }, NOW)).toBe(
      false,
    );
    expect(isCurrentGrant({ revokedAt: null, expiresAt: '2026-08-22T12:00:01.000Z' }, NOW)).toBe(
      true,
    );
  });
});
