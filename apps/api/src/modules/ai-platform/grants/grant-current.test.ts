import { describe, expect, it } from 'vitest';
import { currentGrantWhere, isCurrentGrant } from './grant-current';

const NOW = new Date('2026-08-22T12:00:00.000Z');

describe('isCurrentGrant', () => {
  it('treats expiresAt <= now as inactive', () => {
    expect(isCurrentGrant({ revokedAt: null, expiresAt: null }, NOW)).toBe(true);
    expect(isCurrentGrant({ revokedAt: NOW, expiresAt: null }, NOW)).toBe(false);
    expect(
      isCurrentGrant({ revokedAt: null, expiresAt: new Date('2026-08-22T12:00:00.000Z') }, NOW),
    ).toBe(false);
    expect(
      isCurrentGrant({ revokedAt: null, expiresAt: new Date('2026-08-22T12:00:01.000Z') }, NOW),
    ).toBe(true);
  });

  it('builds a Prisma where that excludes expired rows', () => {
    expect(currentGrantWhere(NOW)).toEqual({
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: NOW } }],
    });
  });
});
