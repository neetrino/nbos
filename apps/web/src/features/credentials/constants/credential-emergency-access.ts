/** Executive roles allowed to use credential break-glass (must match API policy). */
export const EMERGENCY_ACCESS_ROLE_SLUGS = ['ceo', 'admin', 'owner'] as const;

export function canUseCredentialEmergencyAccess(roleSlug: string | undefined): boolean {
  if (!roleSlug) return false;
  return EMERGENCY_ACCESS_ROLE_SLUGS.includes(
    roleSlug.toLowerCase() as (typeof EMERGENCY_ACCESS_ROLE_SLUGS)[number],
  );
}
