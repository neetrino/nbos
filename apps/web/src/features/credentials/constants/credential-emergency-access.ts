import { EMERGENCY_ACCESS_ROLE_SLUGS } from './credential-emergency-access.constants';

export function canUseCredentialEmergencyAccess(roleSlug: string | undefined): boolean {
  if (!roleSlug) return false;
  return EMERGENCY_ACCESS_ROLE_SLUGS.includes(
    roleSlug.toLowerCase() as (typeof EMERGENCY_ACCESS_ROLE_SLUGS)[number],
  );
}
