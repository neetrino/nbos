import type { Prisma } from '@nbos/database';

/** Non-revoked grants that are not past optional expiry. */
export function activeResourceAccessGrantWhere(
  now: Date = new Date(),
): Pick<Prisma.ResourceAccessGrantWhereInput, 'revokedAt' | 'OR'> {
  return {
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}
