export function isCurrentGrant(
  grant: { revokedAt: string | Date | null; expiresAt: string | Date | null },
  now: Date = new Date(),
): boolean {
  if (grant.revokedAt) {
    return false;
  }
  if (!grant.expiresAt) {
    return true;
  }
  const expiresAt = grant.expiresAt instanceof Date ? grant.expiresAt : new Date(grant.expiresAt);
  return expiresAt.getTime() > now.getTime();
}
