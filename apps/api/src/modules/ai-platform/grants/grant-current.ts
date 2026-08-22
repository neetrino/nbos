export function isCurrentGrant(
  grant: { revokedAt: Date | null; expiresAt: Date | null },
  now: Date = new Date(),
): boolean {
  if (grant.revokedAt) {
    return false;
  }
  if (!grant.expiresAt) {
    return true;
  }
  return grant.expiresAt.getTime() > now.getTime();
}

export function currentGrantWhere(now: Date = new Date()) {
  return {
    revokedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}
